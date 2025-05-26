const express = require("express");
const reportRouter = express.Router();
const { checkDepartmentAccess, authenticateToken } = require("../middlewares/AuthMiddleware");
const {
    generateMonthlyReport,
    getMonthlyReportJson,
    generateFilteredReport,
    getYearlyReportSummary,
    getDepartmentPerformanceReport,
    getReportFilterOptions,
    getDashboardSummary,
} = require("../controllers/ReportController");

reportRouter.use(authenticateToken);
reportRouter.use(checkDepartmentAccess);

reportRouter.get('/monthly-pdf', generateMonthlyReport);
reportRouter.get('/monthly-json', getMonthlyReportJson);
reportRouter.get('/filtered', generateFilteredReport);
reportRouter.get('/yearly-summary', getYearlyReportSummary);
reportRouter.get('/department-performance', getDepartmentPerformanceReport);
reportRouter.get('/filter-options', getReportFilterOptions);
reportRouter.get('/dashboard-summary', getDashboardSummary);

module.exports = reportRouter;
