const admin = require("firebase-admin");

const cleanupExpiredRateLimits = async () => {
  const db = admin.firestore();
  const now = new Date();

  try {
    const expiredDocs = await db
      .collection("aiRateLimits")
      .where("expiresAt", "<", now)
      .limit(500)
      .get();

    const batch = db.batch();
    expiredDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (expiredDocs.docs.length > 0) {
      await batch.commit();
      console.log(
        `Cleaned up ${expiredDocs.docs.length} expired rate limit documents`
      );
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
};

module.exports = { cleanupExpiredRateLimits };
