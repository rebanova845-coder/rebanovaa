import type { ActionFunctionArgs } from "react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ACCOUNT_ID = "3c64d6e9c503ea96722879a678f7da7e";
const R2_BUCKET_NAME = "rebanova";
const PUBLIC_R2_URL = "https://media.rebanova.store";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "4e664370eda8e092f3e8d62ea546e350",
    secretAccessKey: "82cd5514bf4f12b9c17a74b00e420824426bca6873e1491b7d6bac65ef4d2928",
  },
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json() as { fileName: string; fileType: string };
    
    if (!body.fileName) {
      return Response.json({ success: false, error: "Nta filename yatanzwe." }, { status: 400 });
    }

    const safeName = body.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const objectKey = `media/${Date.now()}_${safeName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: body.fileType || "video/mp4",
    });

    // Twashyizemo amasaha 24 (amasegonda 86400) kugira ngo upload igende neza 
    // kabone n'iyo yaba ari video ifite ubunini bunini cyane cyangwa internet itinda cyane.
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 86400 });
    const publicUrl = `${PUBLIC_R2_URL}/${objectKey}`;

    return Response.json({ success: true, uploadUrl, publicUrl });
  } catch (err: any) {
    console.error("Presigned URL Error:", err);
    return Response.json({ success: false, error: err.message || "Failed to generate presigned URL" }, { status: 500 });
  }
}