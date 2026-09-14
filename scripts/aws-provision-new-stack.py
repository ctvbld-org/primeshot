#!/usr/bin/env python3
"""Provision S3 + CloudFront + signing keys in the new Primeshot AWS account."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

PROFILE = "primeshot-new"
REGION = "us-east-1"
BUCKET = "primeshot-uploads-02"
KEY_NAME = "primeshot-app-signing"
SCRIPTS = Path(__file__).resolve().parent
KEY_DIR = SCRIPTS / ".aws-cf-keys"
OUT_ENV = SCRIPTS / ".aws-migration-output.env"

CORS = {
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:4000",
                "https://dev.primeshot.ai",
                "https://staging.primeshot.ai",
                "https://staging-webapp.primeshot.ai",
                "https://primeshot.ai",
                "https://www.primeshot.ai",
            ],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3600,
        }
    ]
}

CACHE_OPTIMIZED = "658327ea-f89d-4fab-a63d-7e88639e58f6"
CACHE_DISABLED = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
CORS_S3_ORIGIN = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"


def session():
    return boto3.Session(profile_name=PROFILE, region_name=REGION)


def ensure_rsa_keys() -> tuple[str, str]:
    KEY_DIR.mkdir(mode=0o700, exist_ok=True)
    priv = KEY_DIR / "private_key.pem"
    pub = KEY_DIR / "public_key.pem"
    if not priv.exists():
        subprocess.run(["openssl", "genrsa", "-out", str(priv), "2048"], check=True)
        subprocess.run(["openssl", "rsa", "-pubout", "-in", str(priv), "-out", str(pub)], check=True)
        priv.chmod(0o600)
    return priv.read_text(), pub.read_text()


def signed_behavior(origin_id: str, path: str, key_group_id: str) -> dict:
    return {
        "PathPattern": path,
        "TargetOriginId": origin_id,
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
        },
        "Compress": True,
        "CachePolicyId": CACHE_DISABLED,
        "TrustedKeyGroups": {"Enabled": True, "Quantity": 1, "Items": [key_group_id]},
        "TrustedSigners": {"Enabled": False, "Quantity": 0},
        "FieldLevelEncryptionId": "",
        "SmoothStreaming": False,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
    }


def main() -> None:
    sess = session()
    sts = sess.client("sts")
    identity = sts.get_caller_identity()
    account = identity["Account"]
    print(f"Account {account} user {identity['Arn']}")

    s3 = sess.client("s3")
    cf = sess.client("cloudfront")
    iam = sess.client("iam")

    try:
        s3.head_bucket(Bucket=BUCKET)
        print(f"Bucket {BUCKET} exists")
    except ClientError:
        print(f"Creating bucket {BUCKET}")
        s3.create_bucket(Bucket=BUCKET)

    s3.put_public_access_block(
        Bucket=BUCKET,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )
    s3.put_bucket_encryption(
        Bucket=BUCKET,
        ServerSideEncryptionConfiguration={
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
                    "BucketKeyEnabled": True,
                }
            ]
        },
    )
    s3.put_bucket_ownership_controls(
        Bucket=BUCKET,
        OwnershipControls={"Rules": [{"ObjectOwnership": "BucketOwnerEnforced"}]},
    )
    s3.put_bucket_cors(Bucket=BUCKET, CORSConfiguration=CORS)
    print("Bucket encryption, block-public, ownership, CORS applied")

    private_pem, public_pem = ensure_rsa_keys()

    pub_id = None
    for item in cf.list_public_keys().get("PublicKeyList", {}).get("Items", []) or []:
        if item.get("Name") == KEY_NAME:
            pub_id = item["Id"]
            break
    if not pub_id:
        caller = f"{KEY_NAME}-{int(datetime.now(timezone.utc).timestamp())}"
        pub_id = cf.create_public_key(
            PublicKeyConfig={
                "CallerReference": caller,
                "Name": KEY_NAME,
                "EncodedKey": public_pem,
            }
        )["PublicKey"]["Id"]
        print(f"Created CloudFront public key {pub_id}")
    else:
        print(f"Reusing CloudFront public key {pub_id}")

    kg_id = None
    for item in cf.list_key_groups().get("KeyGroupList", {}).get("Items", []) or []:
        kg = item.get("KeyGroup", {})
        if kg.get("KeyGroupConfig", {}).get("Name") == KEY_NAME:
            kg_id = kg["Id"]
            break
    if not kg_id:
        kg_id = cf.create_key_group(
            KeyGroupConfig={"Name": KEY_NAME, "Items": [pub_id]}
        )["KeyGroup"]["Id"]
        print(f"Created key group {kg_id}")
    else:
        print(f"Reusing key group {kg_id}")

    oac_id = None
    oac_list = cf.list_origin_access_controls().get("OriginAccessControlList", {})
    for item in oac_list.get("Items", []) or []:
        if item.get("Name") == BUCKET:
            oac_id = item["Id"]
            break
    if not oac_id:
        oac_id = cf.create_origin_access_control(
            OriginAccessControlConfig={
                "Name": BUCKET,
                "Description": f"OAC for {BUCKET}",
                "SigningProtocol": "sigv4",
                "SigningBehavior": "always",
                "OriginAccessControlOriginType": "s3",
            }
        )["OriginAccessControl"]["Id"]
        print(f"Created OAC {oac_id}")
    else:
        print(f"Reusing OAC {oac_id}")

    dist_id = None
    dist_domain = None
    dists = cf.list_distributions().get("DistributionList", {})
    for item in dists.get("Items", []) or []:
        origins = item.get("Origins", {}).get("Items", [])
        if origins and origins[0].get("DomainName") == f"{BUCKET}.s3.{REGION}.amazonaws.com":
            dist_id = item["Id"]
            dist_domain = item["DomainName"]
            break

    if not dist_id:
        caller = f"{BUCKET}-{int(datetime.now(timezone.utc).timestamp())}"
        origin_id = BUCKET
        config = {
            "CallerReference": caller,
            "Comment": f"Primeshot uploads CDN ({BUCKET})",
            "Enabled": True,
            "PriceClass": "PriceClass_All",
            "HttpVersion": "http2",
            "IsIPV6Enabled": True,
            "Origins": {
                "Quantity": 1,
                "Items": [
                    {
                        "Id": origin_id,
                        "DomainName": f"{BUCKET}.s3.{REGION}.amazonaws.com",
                        "OriginAccessControlId": oac_id,
                        "S3OriginConfig": {"OriginAccessIdentity": ""},
                    }
                ],
            },
            "DefaultCacheBehavior": {
                "TargetOriginId": origin_id,
                "ViewerProtocolPolicy": "redirect-to-https",
                "AllowedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                    "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
                },
                "Compress": True,
                "CachePolicyId": CACHE_OPTIMIZED,
                "OriginRequestPolicyId": CORS_S3_ORIGIN,
                "TrustedKeyGroups": {"Enabled": False, "Quantity": 0},
                "TrustedSigners": {"Enabled": False, "Quantity": 0},
                "FieldLevelEncryptionId": "",
                "SmoothStreaming": False,
                "LambdaFunctionAssociations": {"Quantity": 0},
                "FunctionAssociations": {"Quantity": 0},
            },
            "CacheBehaviors": {
                "Quantity": 3,
                "Items": [
                    signed_behavior(origin_id, "user-images/*", kg_id),
                    signed_behavior(origin_id, "source-images/*", kg_id),
                    signed_behavior(origin_id, "generated-images/*", kg_id),
                ],
            },
            "ViewerCertificate": {
                "CloudFrontDefaultCertificate": True,
                "MinimumProtocolVersion": "TLSv1.2_2021",
            },
            "Restrictions": {
                "GeoRestriction": {"RestrictionType": "none", "Quantity": 0}
            },
        }
        created = cf.create_distribution(DistributionConfig=config)["Distribution"]
        dist_id = created["Id"]
        dist_domain = created["DomainName"]
        print(f"Created CloudFront {dist_id} {dist_domain}")
    else:
        print(f"Reusing CloudFront {dist_id} {dist_domain}")

    policy = {
        "Version": "2012-10-17",
        "Id": "PolicyForCloudFrontPrivateContent",
        "Statement": [
            {
                "Sid": "AllowCloudFrontServicePrincipal",
                "Effect": "Allow",
                "Principal": {"Service": "cloudfront.amazonaws.com"},
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{BUCKET}/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{account}:distribution/{dist_id}"
                    }
                },
            }
        ],
    }
    s3.put_bucket_policy(Bucket=BUCKET, Policy=json.dumps(policy))
    print("Bucket policy attached to CloudFront")

    creds = sess.get_credentials().get_frozen_credentials()
    OUT_ENV.write_text(
        "\n".join(
            [
                f"AWS_ACCESS_KEY_ID={creds.access_key}",
                f"AWS_SECRET_ACCESS_KEY={creds.secret_key}",
                f"AWS_REGION={REGION}",
                f"AWS_S3_BUCKET={BUCKET}",
                f"NEXT_PUBLIC_AWS_REGION={REGION}",
                f"NEXT_PUBLIC_AWS_S3_BUCKET={BUCKET}",
                f"NEXT_PUBLIC_AWS_DISTRIBUTION=https://{dist_domain}",
                f"CLOUDFRONT_KEY_PAIR_ID={pub_id}",
                f"CLOUDFRONT_DISTRIBUTION_ID={dist_id}",
                f"AWS_BUCKET={BUCKET}",
                "CLOUDFRONT_PRIVATE_KEY_FILE=" + str(KEY_DIR / "private_key.pem"),
                "",
            ]
        )
    )
    OUT_ENV.chmod(0o600)
    (KEY_DIR / "public_key_id.txt").write_text(pub_id + "\n")
    print(f"Wrote {OUT_ENV}")
    print(f"CDN https://{dist_domain}")
    print("Cost Explorer: enable in the new account Billing console if the admin cost page is empty (can take 24h).")


if __name__ == "__main__":
    main()
