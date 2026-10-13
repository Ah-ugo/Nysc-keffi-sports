# Keffi Camp Charity Lottery — Setup & Deployment Guide

This application is built for the **NYSC Orientation Camp, Keffi, Nasarawa State** charity/fundraising competition lottery.

## 1. Cloudinary Setup (Configured)
The Cloudinary integration is configured with your account:
- Cloud Name: `nohyefdw`
- API Key: `441471982266462`
- Unsigned Preset: `keffi_camp_unsigned`

Competition posters and public media are uploaded directly to Cloudinary and stored as URLs and public IDs in Firestore. Firebase Storage is never used.

## 2. Firebase Deployment
Deploy to your own Firebase project:
```bash
npm run build
firebase deploy
```

## 3. Paystack Setup
Set Paystack keys in `.env` (Public keys) and Firebase Secrets (Secret keys for Cloud Functions verification):
```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY_TEST
firebase functions:secrets:set PAYSTACK_SECRET_KEY_LIVE
```
