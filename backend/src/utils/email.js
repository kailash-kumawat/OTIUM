import emailjs from "@emailjs/nodejs";
import { config } from "../config/env.config.js";

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    await emailjs.send(
      config.emailjsServiceId,
      config.emailjsTemplateId,
      { email: email, reset_password_link: resetLink },
      {
        publicKey: config.emailjsPublicKey,
        privateKey: config.emailjsPrivateKey,
      },
    );

    console.log("if that email exists, we've sent a reset link");
  } catch (error) {
    console.error("EmailJS failed:", error);
  }
};
