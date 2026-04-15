import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const GROSS_PAIR_INCOME = 1000; // 1 Pair = 1000 rupees
const TDS_PERCENTAGE = 5; // 5% TDS
const SERVICE_CHARGE_PERCENTAGE = 15; // 15% Service Charge

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        await connectDB();
        const user = await User.findOne({ username: session.user.username });
        if (!user) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }
        const leftCount = user.totalDirect?.left || 0;
        const rightCount = user.totalDirect?.right || 0;
        const completedPairs = Math.min(leftCount, rightCount);
        const processedPairs = (user.basicIncomeRecords || []).length || 0;
        const newPairs = completedPairs - processedPairs;

        if (newPairs <= 0) {
            return Response.json({
                success: true,
                message: "No new pairs to process",
                data: {
                    completedPairs,
                    processedPairs,
                    newPairs: 0,
                    basicIncome: user.basicIncome || 0,
                    records: user.basicIncomeRecords || []
                }
            });
        }

        const grossIncome = newPairs * GROSS_PAIR_INCOME;
        const tdsAmount = (grossIncome * TDS_PERCENTAGE) / 100;
        const serviceChargeAmount = (grossIncome * SERVICE_CHARGE_PERCENTAGE) / 100;
        const netIncome = grossIncome - tdsAmount - serviceChargeAmount;

        // Create new records for each pair
        const newRecords = [];
        const startSrNo = (user.basicIncomeRecords || []).length + 1;

        for (let i = 0; i < newPairs; i++) {
            newRecords.push({
                srNo: startSrNo + i,
                amount: GROSS_PAIR_INCOME,
                pairCount: 1,
                date: new Date(),
                description: `Income from ${i + 1} pair completion - Left: ${leftCount}, Right: ${rightCount}`,
                status: 'Paid',
            });
        }

        // Update user's basicIncome and records
        const updatedBasicIncome = (user.basicIncome || 0) + netIncome;
        const updatedRecords = [...(user.basicIncomeRecords || []), ...newRecords];

        user.basicIncome = updatedBasicIncome;
        user.basicIncomeRecords = updatedRecords;
        await user.save();

        return Response.json({
            success: true,
            message: `${newPairs} pair(s) processed successfully`,
            data: {
                pairsProcessed: newPairs,
                grossIncome,
                tdsDeduction: tdsAmount,
                serviceChargeDeduction: serviceChargeAmount,
                netIncome,
                totalBasicIncome: updatedBasicIncome,
                incomeBreakdown: {
                    grossPerPair: GROSS_PAIR_INCOME,
                    tdsPerPair: (GROSS_PAIR_INCOME * TDS_PERCENTAGE) / 100,
                    serviceChargePerPair: (GROSS_PAIR_INCOME * SERVICE_CHARGE_PERCENTAGE) / 100,
                    netPerPair: GROSS_PAIR_INCOME - (GROSS_PAIR_INCOME * TDS_PERCENTAGE) / 100 - (GROSS_PAIR_INCOME * SERVICE_CHARGE_PERCENTAGE) / 100,
                },
                completedPairs,
                processedPairs: updatedRecords.length,
                records: updatedRecords
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error calculating binary income:', error);
        return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET endpoint to view current binary income status
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ username: session.user.username });

        if (!user) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const leftCount = user.totalDirect?.left || 0;
        const rightCount = user.totalDirect?.right || 0;
        const completedPairs = Math.min(leftCount, rightCount);
        const processedPairs = (user.basicIncomeRecords || []).length || 0;
        const pendingPairs = completedPairs - processedPairs;

        return Response.json({
            success: true,
            data: {
                leftSide: leftCount,
                rightSide: rightCount,
                completedPairs,
                processedPairs,
                pendingPairs,
                grossIncome: user.basicIncome ? (user.basicIncome * 100) / 80 : 0, // Calculate gross from net (800 = 80% of 1000)
                netIncome: user.basicIncome || 0,
                incomePerPair: {
                    gross: GROSS_PAIR_INCOME,
                    tds: (GROSS_PAIR_INCOME * TDS_PERCENTAGE) / 100,
                    serviceCharge: (GROSS_PAIR_INCOME * SERVICE_CHARGE_PERCENTAGE) / 100,
                    net: GROSS_PAIR_INCOME - (GROSS_PAIR_INCOME * TDS_PERCENTAGE) / 100 - (GROSS_PAIR_INCOME * SERVICE_CHARGE_PERCENTAGE) / 100,
                },
                records: user.basicIncomeRecords || []
            }
        });

    } catch (error) {
        console.error('Error fetching binary income:', error);
        return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
