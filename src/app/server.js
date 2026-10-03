const express = require('express');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const app = express();
const PORT = process.env.PORT || 3000;
const REGION = process.env.AWS_REGION || 'us-east-1';
const SECRET_NAME = process.env.DB_SECRET_NAME || 'enterprise/app/db-credentials';
const DB_HOST = process.env.DB_HOST || 'enterprise-primary-db.c8fskse84o2t.us-east-1.rds.amazonaws.com';

const smClient = new SecretsManagerClient({ region: REGION });

async function getDbCredentials() {
  const response = await smClient.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
  return JSON.parse(response.SecretString);
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Healthy', timestamp: new Date().toISOString() });
});

app.get('/api/status', async (req, res) => {
  try {
    const creds = await getDbCredentials();
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: creds.username,
      password: creds.password,
      database: 'appdb'
    });

    const [rows] = await connection.execute('SELECT NOW() AS currentTime');
    await connection.end();

    const efsPath = '/mnt/efs/shared_log.txt';
    fs.appendFileSync(efsPath, `Access recorded at: ${new Date().toISOString()}\n`);

    res.json({
      status: 'Success',
      database: 'Connected via AWS Secrets Manager',
      rdsTimestamp: rows[0].currentTime,
      efsMounted: fs.existsSync(efsPath),
      architecture: 'Enterprise Multi-AZ 3-Tier Web Infrastructure'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('
