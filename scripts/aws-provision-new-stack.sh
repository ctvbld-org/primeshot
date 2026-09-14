#!/usr/bin/env bash
# Provision a replacement S3 + CloudFront + IAM stack for Primeshot.
# Uses AWS profile primeshot-terraform (account root) unless AWS_PROFILE is set.
set -euo pipefail

PROFILE="${AWS_PROFILE:-primeshot-terraform}"
REGION="${AWS_REGION:-us-east-1}"
BUCKET="${AWS_S3_BUCKET_NEW:-primeshot-uploads-02}"
OLD_BUCKET="${AWS_S3_BUCKET_OLD:-primeshot-uploads-01}"
IAM_USER="${AWS_IAM_USER:-primeshot-app}"
KEY_NAME="${AWS_CF_KEY_NAME:-primeshot-app-signing}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_ENV="${OUT_DIR}/.aws-migration-output.env"
KEY_DIR="${OUT_DIR}/.aws-cf-keys"
CALLER_REF="primeshot-${BUCKET}-$(date +%s)"

mkdir -p "${KEY_DIR}"

echo "Using profile=${PROFILE} region=${REGION} bucket=${BUCKET}"
ACCOUNT_ID="$(aws sts get-caller-identity --profile "${PROFILE}" --query Account --output text)"
echo "Account ${ACCOUNT_ID}"

if ! aws s3api head-bucket --bucket "${BUCKET}" --profile "${PROFILE}" 2>/dev/null; then
  echo "Creating bucket ${BUCKET}"
  aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}" --profile "${PROFILE}"
else
  echo "Bucket ${BUCKET} already exists"
fi

aws s3api put-public-access-block --profile "${PROFILE}" --bucket "${BUCKET}" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption --profile "${PROFILE}" --bucket "${BUCKET}" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

aws s3api put-bucket-ownership-controls --profile "${PROFILE}" --bucket "${BUCKET}" \
  --ownership-controls '{"Rules":[{"ObjectOwnership":"BucketOwnerEnforced"}]}'

aws s3api put-bucket-cors --profile "${PROFILE}" --bucket "${BUCKET}" --cors-configuration '{
  "CORSRules": [{
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
      "https://www.primeshot.ai"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }]
}'

if [[ ! -f "${KEY_DIR}/private_key.pem" ]]; then
  echo "Generating CloudFront RSA key pair"
  openssl genrsa -out "${KEY_DIR}/private_key.pem" 2048
  openssl rsa -pubout -in "${KEY_DIR}/private_key.pem" -out "${KEY_DIR}/public_key.pem"
  chmod 600 "${KEY_DIR}/private_key.pem"
fi

EXISTING_PUB_KEY_ID="$(aws cloudfront list-public-keys --profile "${PROFILE}" \
  --query "PublicKeyList.Items[?Name=='${KEY_NAME}'].Id | [0]" --output text)"
if [[ -z "${EXISTING_PUB_KEY_ID}" || "${EXISTING_PUB_KEY_ID}" == "None" ]]; then
  PUB_KEY_ID="$(aws cloudfront create-public-key --profile "${PROFILE}" \
    --public-key-config "CallerReference=${CALLER_REF}-pk,Name=${KEY_NAME},EncodedKey=$(awk '{printf "%s\\n", $0}' "${KEY_DIR}/public_key.pem")" \
    --query 'PublicKey.Id' --output text)"
else
  PUB_KEY_ID="${EXISTING_PUB_KEY_ID}"
  echo "Reusing CloudFront public key ${PUB_KEY_ID}"
fi

EXISTING_KG_ID="$(aws cloudfront list-key-groups --profile "${PROFILE}" \
  --query "KeyGroupList.Items[?KeyGroup.KeyGroupConfig.Name=='${KEY_NAME}'].KeyGroup.Id | [0]" --output text 2>/dev/null || true)"
if [[ -z "${EXISTING_KG_ID}" || "${EXISTING_KG_ID}" == "None" ]]; then
  KG_JSON="$(aws cloudfront create-key-group --profile "${PROFILE}" --key-group-config "Name=${KEY_NAME},Items=${PUB_KEY_ID}")"
  KEY_GROUP_ID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["KeyGroup"]["Id"])' <<<"${KG_JSON}")"
else
  KEY_GROUP_ID="${EXISTING_KG_ID}"
  echo "Reusing CloudFront key group ${KEY_GROUP_ID}"
fi

EXISTING_OAC_ID="$(aws cloudfront list-origin-access-controls --profile "${PROFILE}" \
  --query "OriginAccessControlList.Items[?Name=='${BUCKET}'].Id | [0]" --output text 2>/dev/null || true)"
if [[ -z "${EXISTING_OAC_ID}" || "${EXISTING_OAC_ID}" == "None" ]]; then
  OAC_JSON="$(aws cloudfront create-origin-access-control --profile "${PROFILE}" --origin-access-control-config "{
    \"Name\": \"${BUCKET}\",
    \"Description\": \"OAC for ${BUCKET}\",
    \"SigningProtocol\": \"sigv4\",
    \"SigningBehavior\": \"always\",
    \"OriginAccessControlOriginType\": \"s3\"
  }")"
  OAC_ID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["OriginAccessControl"]["Id"])' <<<"${OAC_JSON}")"
else
  OAC_ID="${EXISTING_OAC_ID}"
  echo "Reusing OAC ${OAC_ID}"
fi

EXISTING_DIST_ID="$(aws cloudfront list-distributions --profile "${PROFILE}" \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='${BUCKET}.s3.${REGION}.amazonaws.com'].Id | [0]" --output text 2>/dev/null || true)"

if [[ -z "${EXISTING_DIST_ID}" || "${EXISTING_DIST_ID}" == "None" ]]; then
  DIST_CONFIG="$(python3 - <<PY
import json
print(json.dumps({
  "CallerReference": "${CALLER_REF}",
  "Comment": "Primeshot uploads CDN (${BUCKET})",
  "Enabled": True,
  "PriceClass": "PriceClass_All",
  "HttpVersion": "http2",
  "IsIPV6Enabled": True,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "${BUCKET}",
      "DomainName": "${BUCKET}.s3.${REGION}.amazonaws.com",
      "OriginAccessControlId": "${OAC_ID}",
      "S3OriginConfig": {"OriginAccessIdentity": ""},
      "ConnectionAttempts": 3,
      "ConnectionTimeout": 10,
      "OriginShield": {"Enabled": False}
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "${BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
    },
    "Compress": True,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
    "TrustedKeyGroups": {"Enabled": False, "Quantity": 0},
    "TrustedSigners": {"Enabled": False, "Quantity": 0},
    "FieldLevelEncryptionId": "",
    "SmoothStreaming": False,
    "LambdaFunctionAssociations": {"Quantity": 0},
    "FunctionAssociations": {"Quantity": 0},
    "GrpcConfig": {"Enabled": False}
  },
  "CacheBehaviors": {
    "Quantity": 3,
    "Items": [
      {
        "PathPattern": "user-images/*",
        "TargetOriginId": "${BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
        },
        "Compress": True,
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "TrustedKeyGroups": {"Enabled": True, "Quantity": 1, "Items": ["${KEY_GROUP_ID}"]},
        "TrustedSigners": {"Enabled": False, "Quantity": 0},
        "FieldLevelEncryptionId": "",
        "SmoothStreaming": False,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "GrpcConfig": {"Enabled": False}
      },
      {
        "PathPattern": "source-images/*",
        "TargetOriginId": "${BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
        },
        "Compress": True,
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "TrustedKeyGroups": {"Enabled": True, "Quantity": 1, "Items": ["${KEY_GROUP_ID}"]},
        "TrustedSigners": {"Enabled": False, "Quantity": 0},
        "FieldLevelEncryptionId": "",
        "SmoothStreaming": False,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "GrpcConfig": {"Enabled": False}
      },
      {
        "PathPattern": "generated-images/*",
        "TargetOriginId": "${BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
        },
        "Compress": True,
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "TrustedKeyGroups": {"Enabled": True, "Quantity": 1, "Items": ["${KEY_GROUP_ID}"]},
        "TrustedSigners": {"Enabled": False, "Quantity": 0},
        "FieldLevelEncryptionId": "",
        "SmoothStreaming": False,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "GrpcConfig": {"Enabled": False}
      }
    ]
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": True,
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Restrictions": {
    "GeoRestriction": {"RestrictionType": "none", "Quantity": 0}
  }
}))
PY
)"
  DIST_JSON="$(aws cloudfront create-distribution --profile "${PROFILE}" --distribution-config "${DIST_CONFIG}")"
  DIST_ID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Distribution"]["Id"])' <<<"${DIST_JSON}")"
  DIST_DOMAIN="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Distribution"]["DomainName"])' <<<"${DIST_JSON}")"
else
  DIST_ID="${EXISTING_DIST_ID}"
  DIST_DOMAIN="$(aws cloudfront get-distribution --id "${DIST_ID}" --profile "${PROFILE}" --query 'Distribution.DomainName' --output text)"
  echo "Reusing CloudFront distribution ${DIST_ID} ${DIST_DOMAIN}"
fi

POLICY="$(python3 - <<PY
import json
print(json.dumps({
  "Version": "2012-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": {"Service": "cloudfront.amazonaws.com"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET}/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"
      }
    }
  }]
}))
PY
)"
aws s3api put-bucket-policy --profile "${PROFILE}" --bucket "${BUCKET}" --policy "${POLICY}"

if ! aws iam get-user --user-name "${IAM_USER}" --profile "${PROFILE}" >/dev/null 2>&1; then
  aws iam create-user --user-name "${IAM_USER}" --profile "${PROFILE}" >/dev/null
fi

POLICY_DOC="$(python3 - <<PY
import json
print(json.dumps({
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Bucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketCors",
        "s3:PutBucketCors",
        "s3:GetBucketLocation",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": "arn:aws:s3:::${BUCKET}"
    },
    {
      "Sid": "S3Objects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    },
    {
      "Sid": "CostAndMetrics",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    }
  ]
}))
PY
)"
aws iam put-user-policy --profile "${PROFILE}" --user-name "${IAM_USER}" \
  --policy-name PrimeshotAppAccess --policy-document "${POLICY_DOC}"

ACCESS_KEY_ID=""
SECRET_ACCESS_KEY=""
if [[ -f "${OUT_ENV}" ]] && grep -q '^AWS_ACCESS_KEY_ID=' "${OUT_ENV}"; then
  # shellcheck disable=SC1090
  source "${OUT_ENV}"
  echo "Reusing access keys already written to ${OUT_ENV}"
else
  KEY_JSON="$(aws iam create-access-key --user-name "${IAM_USER}" --profile "${PROFILE}")"
  ACCESS_KEY_ID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["AccessKey"]["AccessKeyId"])' <<<"${KEY_JSON}")"
  SECRET_ACCESS_KEY="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["AccessKey"]["SecretAccessKey"])' <<<"${KEY_JSON}")"
fi

CF_PRIVATE_KEY="$(python3 - <<PY
from pathlib import Path
print(Path("${KEY_DIR}/private_key.pem").read_text())
PY
)"

umask 077
cat > "${OUT_ENV}" <<EOF
AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
AWS_REGION=${REGION}
AWS_S3_BUCKET=${BUCKET}
NEXT_PUBLIC_AWS_REGION=${REGION}
NEXT_PUBLIC_AWS_S3_BUCKET=${BUCKET}
NEXT_PUBLIC_AWS_DISTRIBUTION=https://${DIST_DOMAIN}
CLOUDFRONT_KEY_PAIR_ID=${PUB_KEY_ID}
CLOUDFRONT_DISTRIBUTION_ID=${DIST_ID}
CLOUDFRONT_PRIVATE_KEY=${CF_PRIVATE_KEY}
AWS_BUCKET=${BUCKET}
EOF

echo
echo "Wrote credentials to ${OUT_ENV} (gitignored)"
echo "CloudFront: https://${DIST_DOMAIN}  id=${DIST_ID}"
echo "Bucket: ${BUCKET}"
echo "IAM user: ${IAM_USER}"
echo "Next: aws s3 sync s3://${OLD_BUCKET} s3://${BUCKET} --profile ${PROFILE}"
