import { Request, Response } from "express";
import AuthService from "../services/authService";
import { sendResponse } from "../utils/response";

export class AuthController {
    
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const user = await AuthService.validateUser(email, password);
            console.log("User returned by validateUser:", user);

            if (!user) {
                return sendResponse(req, res, false, 401, "Invalid credentials");
            }

            const token = AuthService.generateAuthToken(user);
            return sendResponse(req, res, true, 200, "User Authenticated", { token });
        } catch (error) {
            console.error("Login Error:", error);
            return sendResponse(req, res, false, 500, "Internal server error.");
        }
    }

    static async updateUserPassword(req: Request, res: Response): Promise<void> {
        try {
            const { userId, bcryptPassword } = req.body;

            if (!userId || !bcryptPassword) {
                return sendResponse(req, res,  false, 400, "Missing userId or bcryptPassword");
            }

            const result = await AuthService.updateUserPassword(userId, bcryptPassword);
            if (!result) {
                return sendResponse(req, res,  false, 500, "Error updating password");
            } else {
                return sendResponse(req, res,  true, 200, "Password updated successfully");
            }
        } catch (error) {
            console.error("Update password error:", error);
            res.status(500).json({ error: "Internal server error" });
            
        }
    }
}