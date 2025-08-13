import Archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
export async function createZipStreamFromS3(s3, bucket, keys) {
    const archive = Archiver('zip', { zlib: { level: 9 } });
    (async () => {
        for (const key of keys) {
            const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            const body = resp.Body;
            const name = key.split('/').pop() || 'file';
            archive.append(body, { name });
        }
        archive.finalize();
    })().catch((e) => archive.emit('error', e));
    return archive;
}
