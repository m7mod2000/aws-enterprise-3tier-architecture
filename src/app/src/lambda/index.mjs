import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "arn:aws:sns:us-east-1:573594947064:enterprise-file-notifications";

export const handler = async (event) => {
    console.log("Event Received:", JSON.stringify(event, null, 2));

    if (!event.Records || !Array.isArray(event.Records)) {
        return { statusCode: 200, body: "No records found" };
    }

    for (const record of event.Records) {
        const bucketName = record.s3 && record.s3.bucket ? record.s3.bucket.name : "unknown-bucket";
        const objectKey = record.s3 && record.s3.object ? decodeURIComponent(record.s3.object.key.replace(/\+/g, " ")) : "unknown-file";
        const objectSize = record.s3 && record.s3.object ? record.s3.object.size : 0;
        const eventTime = record.eventTime || new Date().toISOString();

        const messageContent = "A new file was uploaded to Enterprise S3 Vault:\n" +
            "Bucket Name: " + bucketName + "\n" +
            "File Name: " + objectKey + "\n" +
            "File Size: " + objectSize + " Bytes\n" +
            "Timestamp: " + eventTime + "\n";

        const params = {
            TopicArn: SNS_TOPIC_ARN,
            Subject: "New File Upload: " + objectKey,
            Message: messageContent
        };

        try {
            await snsClient.send(new PublishCommand(params));
            console.log("Notification published for: " + objectKey);
        } catch (err) {
            console.error("SNS Error:", err);
            throw err;
        }
    }

    return { statusCode: 200, body: "Success" };
};
