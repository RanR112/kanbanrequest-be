const { getMonthlyReportData, getReportStatistics, getFilteredReportData } = require('../utils/reportHelper');
const { createPdfReport } = require('../utils/pdfGenerator');
const { format, startOfMonth, endOfMonth, parseISO, subMonths, startOfYear, endOfYear } = require('date-fns');
const { id } = require('date-fns/locale');
const prisma = require('../../prisma/client');

/**
 * Generate monthly PDF report
 */
exports.generateMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query; // Format: month=1&year=2024
        
        if (!month || !year) {
            return res.status(400).json({ 
                message: "Month and year parameters are required" 
            });
        }

        // Validate month and year
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ 
                message: "Month must be between 1 and 12" 
            });
        }

        if (yearNum < 2020 || yearNum > new Date().getFullYear() + 1) {
            return res.status(400).json({ 
                message: "Invalid year provided" 
            });
        }

        // Create date range for the specified month
        const targetDate = new Date(yearNum, monthNum - 1, 1);
        const startDate = startOfMonth(targetDate);
        const endDate = endOfMonth(targetDate);

        // Get report data and statistics
        const [reportData, statistics] = await Promise.all([
            getMonthlyReportData(startDate, endDate),
            getReportStatistics(startDate, endDate)
        ]);

        if (reportData.length === 0) {
            return res.status(404).json({ 
                message: "No data found for the specified month" 
            });
        }

        // Format month name
        const monthName = format(targetDate, "MMMM yyyy", { locale: id });

        // Generate PDF
        createPdfReport(res, reportData, monthName, statistics);

    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ 
            message: "Error generating report", 
            error: error.message 
        });
    }
};

/**
 * Get monthly report data in JSON format
 */
exports.getMonthlyReportJson = async (req, res) => {
    try {
        const { month, year } = req.query;
        
        if (!month || !year) {
            return res.status(400).json({ 
                message: "Month and year parameters are required" 
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ 
                message: "Month must be between 1 and 12" 
            });
        }

        // Create date range
        const targetDate = new Date(yearNum, monthNum - 1, 1);
        const startDate = startOfMonth(targetDate);
        const endDate = endOfMonth(targetDate);

        // Get data
        const [reportData, statistics] = await Promise.all([
            getMonthlyReportData(startDate, endDate),
            getReportStatistics(startDate, endDate)
        ]);

        const monthName = format(targetDate, "MMMM yyyy", { locale: id });

        res.json({
            success: true,
            data: {
                period: {
                    month: monthNum,
                    year: yearNum,
                    monthName: monthName,
                    startDate: format(startDate, "yyyy-MM-dd"),
                    endDate: format(endDate, "yyyy-MM-dd")
                },
                statistics,
                requests: reportData
            }
        });

    } catch (error) {
        console.error('Error getting monthly report data:', error);
        res.status(500).json({ 
            message: "Error retrieving report data", 
            error: error.message 
        });
    }
};

/**
 * Generate filtered report with custom parameters
 */
exports.generateFilteredReport = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            departmentId, 
            status, 
            classification, 
            userId,
            format: outputFormat = 'pdf' 
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                message: "Start date and end date are required" 
            });
        }

        // Parse and validate dates
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                message: "Invalid date format. Use YYYY-MM-DD" 
            });
        }

        if (start > end) {
            return res.status(400).json({ 
                message: "Start date must be before end date" 
            });
        }

        // Build filters object
        const filters = {};
        if (departmentId) filters.departmentId = parseInt(departmentId);
        if (status) filters.status = status;
        if (classification) filters.classification = classification;
        if (userId) filters.userId = parseInt(userId);

        // Get filtered data
        const [reportData, statistics] = await Promise.all([
            getFilteredReportData(start, end, filters),
            getReportStatistics(start, end)
        ]);

        if (reportData.length === 0) {
            return res.status(404).json({ 
                message: "No data found for the specified criteria" 
            });
        }

        // Format period name
        const periodName = `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;

        if (outputFormat.toLowerCase() === 'json') {
            return res.json({
                success: true,
                data: {
                    period: {
                        startDate: format(start, "yyyy-MM-dd"),
                        endDate: format(end, "yyyy-MM-dd"),
                        periodName
                    },
                    filters,
                    statistics,
                    requests: reportData
                }
            });
        }

        // Generate PDF
        createPdfReport(res, reportData, `Laporan Periode ${periodName}`, statistics);

    } catch (error) {
        console.error('Error generating filtered report:', error);
        res.status(500).json({ 
            message: "Error generating filtered report", 
            error: error.message 
        });
    }
};

/**
 * Get yearly report summary
 */
exports.getYearlyReportSummary = async (req, res) => {
    try {
        const { year } = req.query;
        
        if (!year) {
            return res.status(400).json({ 
                message: "Year parameter is required" 
            });
        }

        const yearNum = parseInt(year);
        if (yearNum < 2020 || yearNum > new Date().getFullYear() + 1) {
            return res.status(400).json({ 
                message: "Invalid year provided" 
            });
        }

        const startDate = startOfYear(new Date(yearNum, 0, 1));
        const endDate = endOfYear(new Date(yearNum, 0, 1));

        // Get monthly breakdown
        const monthlyData = [];
        for (let month = 0; month < 12; month++) {
            const monthStart = startOfMonth(new Date(yearNum, month, 1));
            const monthEnd = endOfMonth(new Date(yearNum, month, 1));
            
            const monthStats = await getReportStatistics(monthStart, monthEnd);
            
            monthlyData.push({
                month: month + 1,
                monthName: format(new Date(yearNum, month, 1), "MMMM", { locale: id }),
                statistics: monthStats
            });
        }

        // Get yearly statistics
        const yearlyStats = await getReportStatistics(startDate, endDate);

        res.json({
            success: true,
            data: {
                year: yearNum,
                yearlyStatistics: yearlyStats,
                monthlyBreakdown: monthlyData
            }
        });

    } catch (error) {
        console.error('Error getting yearly report summary:', error);
        res.status(500).json({ 
            message: "Error retrieving yearly report", 
            error: error.message 
        });
    }
};

/**
 * Get department performance report
 */
exports.getDepartmentPerformanceReport = async (req, res) => {
    try {
        const { departmentId, startDate, endDate } = req.query;

        if (!departmentId) {
            return res.status(400).json({ 
                message: "Department ID is required" 
            });
        }

        // Use current month as default if dates not provided
        const start = startDate ? parseISO(startDate) : startOfMonth(new Date());
        const end = endDate ? parseISO(endDate) : endOfMonth(new Date());

        // Get department info
        const department = await prisma.department.findUnique({
            where: { id_department: parseInt(departmentId) },
            include: {
                users: {
                    select: {
                        id_users: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        if (!department) {
            return res.status(404).json({ 
                message: "Department not found" 
            });
        }

        // Get department-specific data
        const filters = { departmentId: parseInt(departmentId) };
        const [reportData, statistics] = await Promise.all([
            getFilteredReportData(start, end, filters),
            getReportStatistics(start, end)
        ]);

        // Get user performance within department
        const userPerformance = await Promise.all(
            department.users.map(async (user) => {
                const userStats = await getReportStatistics(start, end);
                const userRequests = await getFilteredReportData(start, end, { userId: user.id_users });
                
                return {
                    userId: user.id_users,
                    name: user.name,
                    role: user.role,
                    totalRequests: userRequests.length,
                    approvedRequests: userRequests.filter(r => 
                        r.status === 'APPROVED_BY_PC' || r.status === 'APPROVED_BY_DEPARTMENT'
                    ).length,
                    rejectedRequests: userRequests.filter(r => 
                        r.status === 'REJECTED_BY_PC' || r.status === 'REJECTED_BY_DEPARTMENT'
                    ).length,
                    pendingRequests: userRequests.filter(r => 
                        r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_PC'
                    ).length
                };
            })
        );

        const periodName = `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;

        res.json({
            success: true,
            data: {
                department: {
                    id: department.id_department,
                    name: department.name,
                    totalUsers: department.users.length
                },
                period: {
                    startDate: format(start, "yyyy-MM-dd"),
                    endDate: format(end, "yyyy-MM-dd"),
                    periodName
                },
                departmentStatistics: {
                    totalRequests: reportData.length,
                    approvedRequests: reportData.filter(r => 
                        r.status === 'APPROVED_BY_PC' || r.status === 'APPROVED_BY_DEPARTMENT'
                    ).length,
                    rejectedRequests: reportData.filter(r => 
                        r.status === 'REJECTED_BY_PC' || r.status === 'REJECTED_BY_DEPARTMENT'
                    ).length,
                    pendingRequests: reportData.filter(r => 
                        r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_PC'
                    ).length
                },
                userPerformance: userPerformance.sort((a, b) => b.totalRequests - a.totalRequests),
                requests: reportData
            }
        });

    } catch (error) {
        console.error('Error getting department performance report:', error);
        res.status(500).json({ 
            message: "Error retrieving department performance report", 
            error: error.message 
        });
    }
};

/**
 * Get available filter options for reports
 */
exports.getReportFilterOptions = async (req, res) => {
    try {
        // Get all departments
        const departments = await prisma.department.findMany({
            select: {
                id_department: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id_users: true,
                name: true,
                role: true,
                department: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [
                { department: { name: 'asc' } },
                { name: 'asc' }
            ]
        });

        // Get available statuses
        const statuses = [
            { value: 'PENDING_APPROVAL', label: 'Menunggu Persetujuan' },
            { value: 'APPROVED_BY_DEPARTMENT', label: 'Disetujui Departemen' },
            { value: 'PENDING_PC', label: 'Menunggu PC' },
            { value: 'APPROVED_BY_PC', label: 'Disetujui PC' },
            { value: 'REJECTED_BY_DEPARTMENT', label: 'Ditolak Departemen' },
            { value: 'REJECTED_BY_PC', label: 'Ditolak PC' }
        ];

        // Get available classifications
        const classifications = await prisma.requestKanban.findMany({
            select: {
                klasifikasi: true
            },
            distinct: ['klasifikasi'],
            orderBy: {
                klasifikasi: 'asc'
            }
        });

        res.json({
            success: true,
            data: {
                departments: departments.map(dept => ({
                    id: dept.id_department,
                    name: dept.name
                })),
                users: users.map(user => ({
                    id: user.id_users,
                    name: user.name,
                    role: user.role,
                    department: user.department.name
                })),
                statuses,
                classifications: classifications.map(c => c.klasifikasi).filter(Boolean)
            }
        });

    } catch (error) {
        console.error('Error getting report filter options:', error);
        res.status(500).json({ 
            message: "Error retrieving filter options", 
            error: error.message 
        });
    }
};

/**
 * Get dashboard summary statistics
 */
exports.getDashboardSummary = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = startOfMonth(currentDate);
        const currentMonthEnd = endOfMonth(currentDate);
        const previousMonth = startOfMonth(subMonths(currentDate, 1));
        const previousMonthEnd = endOfMonth(subMonths(currentDate, 1));

        // Get current month and previous month statistics
        const [currentStats, previousStats] = await Promise.all([
            getReportStatistics(currentMonth, currentMonthEnd),
            getReportStatistics(previousMonth, previousMonthEnd)
        ]);

        // Calculate trends
        const totalTrend = currentStats.total - previousStats.total;
        const approvedTrend = currentStats.approved - previousStats.approved;
        const rejectedTrend = currentStats.rejected - previousStats.rejected;

        // Get recent requests (last 10)
        const recentRequests = await getFilteredReportData(
            subMonths(currentDate, 1), 
            currentDate,
            {}
        );

        res.json({
            success: true,
            data: {
                currentMonth: {
                    name: format(currentDate, "MMMM yyyy", { locale: id }),
                    statistics: currentStats
                },
                previousMonth: {
                    name: format(subMonths(currentDate, 1), "MMMM yyyy", { locale: id }),
                    statistics: previousStats
                },
                trends: {
                    total: {
                        value: totalTrend,
                        percentage: previousStats.total > 0 ? 
                            Math.round((totalTrend / previousStats.total) * 100) : 0
                    },
                    approved: {
                        value: approvedTrend,
                        percentage: previousStats.approved > 0 ? 
                            Math.round((approvedTrend / previousStats.approved) * 100) : 0
                    },
                    rejected: {
                        value: rejectedTrend,
                        percentage: previousStats.rejected > 0 ? 
                            Math.round((rejectedTrend / previousStats.rejected) * 100) : 0
                    }
                },
                recentRequests: recentRequests.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('Error getting dashboard summary:', error);
        res.status(500).json({ 
            message: "Error retrieving dashboard summary", 
            error: error.message 
        });
    }
};