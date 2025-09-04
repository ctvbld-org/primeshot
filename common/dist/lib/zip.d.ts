import Archiver from 'archiver';
import type { S3Client } from '@aws-sdk/client-s3';
export interface ZipPartLimits {
    maxFiles?: number;
    maxBytes?: number;
}
export declare function createZipStreamFromS3(s3: S3Client, bucket: string, keys: string[], limits?: ZipPartLimits): Promise<Archiver.Archiver>;
