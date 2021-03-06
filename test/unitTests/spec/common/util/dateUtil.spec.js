describe('DateUtil', () => {
    var dateUtil = Bahmni.Common.Util.DateUtil;
    var dateFormat = "YYYY-MM-DDTHH:mm:ss.SSS";

    it("should parse datetime string format", () => {
        var parsed = dateUtil.parseDatetime("2015-12-05 16:02:45");
        expect(parsed).toEqual(moment("2015-12-05 16:02:45"));
    });

    describe("isSameDateTime", () => {
        it("should be true if two dates and times are same", () => {
            expect(dateUtil.isSameDateTime("2014-01-20T11:12:13.000Z", "2014-01-20T11:12:13.000Z")).toBeTruthy();
            expect(dateUtil.isSameDateTime("2014-01-20T11:12:13.000+0530", "2014-01-20T11:12:13.000+0530")).toBeTruthy();

            expect(dateUtil.isSameDateTime("2014-01-20T11:12:13.000+0530", "2014-01-20T11:12:12.000+0530")).toBeFalsy();
            expect(dateUtil.isSameDateTime("2014-01-20T11:12:13.000+0530", "2014-01-21T11:12:13.000+0530")).toBeFalsy();
            expect(dateUtil.isSameDateTime(undefined, "2014-01-20T11:12:13.000Z")).toBeFalsy();
            expect(dateUtil.isSameDateTime("2014-01-20T11:12:13.000Z", null)).toBeFalsy();
        });
    });

    describe("isSameDate", () => {
        it("should be true if two dates are same irrespective of time", () => {
            var firstDate = new Date();
            var secondDate = new Date();
            firstDate.setHours(0, 0, 0, 0, 0);
            secondDate.setHours(23, 59, 0, 0, 0);
            expect(dateUtil.isSameDate(firstDate, secondDate)).toBeTruthy();

            secondDate.setFullYear(secondDate.getFullYear()+1);
            expect(dateUtil.isSameDate(firstDate, secondDate)).toBeFalsy();
            expect(dateUtil.isSameDate(undefined, new Date().toString())).toBeFalsy();
            expect(dateUtil.isSameDate(new Date().toString(), null)).toBeFalsy();
        });
    });

    describe('diffInYearsMonthsDays', () => {
        it("should calculate difference between dates when month and day are same", () => {
            var fromDate = new Date();
            var toDate = new Date();
            toDate.setFullYear(toDate.getFullYear()+2);

            var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

            expect(period.years).toBe(2);
            expect(period.months).toBe(0);
            expect(period.days).toBe(0);
        });

        it("should calculate difference between dates when month of fromDate is lesser than month of toDate", () => {
            var fromDate = new Date();
            fromDate.setDate(21);
            fromDate.setMonth(7);
            fromDate.setFullYear(2011);
            var toDate = new Date();
            toDate.setDate(21);
            toDate.setMonth(5);
            toDate.setFullYear(2013);

            var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

            expect(period.years).toBe(1);
            expect(period.months).toBe(10);
            expect(period.days).toBe(0);
        });

        it("should calculate difference between dates when date of fromDate is greater than date of toDate", () => {
            var fromDate = new Date();
            fromDate.setDate(25);
            fromDate.setMonth(7);
            fromDate.setFullYear(2011);
            var toDate = new Date();
            toDate.setDate(15);
            toDate.setMonth(7);
            toDate.setFullYear(2013);

            var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

            expect(period.years).toBe(1);
            expect(period.months).toBe(11);
            expect(period.days).toBe(21);
        });

        describe('when fromDate is february', () => {
            it("should calculate difference between dates when fromDate is non-leap year", () => {
                var fromDate = new Date();
                fromDate.setDate(26);
                fromDate.setMonth(1);
                fromDate.setFullYear(2011);
                var toDate = new Date();
                toDate.setDate(15);
                toDate.setMonth(2);
                toDate.setFullYear(2011);
                var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

                expect(period.years).toBe(0);
                expect(period.months).toBe(0);
                expect(period.days).toBe(17);
            });

            it("should calculate difference between dates when fromDate is leap year", () => {
                var fromDate = new Date();
                fromDate.setDate(26);
                fromDate.setMonth(1);
                fromDate.setFullYear(2012);
                var toDate = new Date();
                toDate.setDate(15);
                toDate.setMonth(2);
                toDate.setFullYear(2012);
                var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

                expect(period.years).toBe(0);
                expect(period.months).toBe(0);
                expect(period.days).toBe(18);
            });
        });


        describe("when day of fromDate is lesser than day of toDate", () => {
            it("should calculate difference between dates when month previous to toDate has 30 days", () => {
                var fromDate = new Date();
                fromDate.setDate(21);
                fromDate.setMonth(6);
                fromDate.setFullYear(2013);
                var toDate = new Date();
                toDate.setDate(15);
                toDate.setMonth(7);
                toDate.setFullYear(2013);

                var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

                expect(period.years).toBe(0);
                expect(period.months).toBe(0);
                expect(period.days).toBe(25);
            });


            it("should calculate difference between dates when month previous to toDate has 30 days", () => {
                var fromDate = new Date();
                fromDate.setDate(21);
                fromDate.setMonth(8);
                fromDate.setFullYear(2013);
                var toDate = new Date();
                toDate.setDate(15);
                toDate.setMonth(9);
                toDate.setFullYear(2013);

                var period = dateUtil.diffInYearsMonthsDays(fromDate, toDate);

                expect(period.years).toBe(0);
                expect(period.months).toBe(0);
                expect(period.days).toBe(24);
            });
        });
    });

    describe("diffInDaysRegardlessOfTime", () => {
        it('should return 0 when dates are same', () => {
            var fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0, 0);
            var toDate = new Date();
            toDate.setHours(23, 59, 0, 0, 0);
            expect(dateUtil.diffInDaysRegardlessOfTime(fromDate, toDate)).toBe(0);
        });

        it('should not change the date time', () => {
            var fromDate = new Date("10/10/2015");
            fromDate.setHours(0, 0, 0, 0, 0);
            var cpOfFromDate = new Date(fromDate);
            var toDate = new Date("10/10/2015");
            toDate.setHours(23, 59, 0, 0, 0);
            var cpOfToDate = new Date(toDate);
            expect(dateUtil.diffInDaysRegardlessOfTime(fromDate, toDate)).toBe(0);
            expect(fromDate).toEqual(cpOfFromDate);
            expect(toDate).toEqual(cpOfToDate);
        });

        it('should return 10 when dates are 10 days apart, regardless of time', () => {
            var fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0, 0);
            var toDate = new Date();
            toDate.setHours(23, 59, 0, 0, 0);
            toDate.setDate(toDate.getDate() + 10);
            expect(dateUtil.diffInDaysRegardlessOfTime(fromDate, toDate)).toBe(10);
        });
    });

    describe("getDayNumber", () => {
        it('should return 1 when date and reference date are same', () => {
            var fromDate = new Date();
            var toDate = new Date();
            expect(dateUtil.getDayNumber(fromDate, toDate)).toBe(1);
        });

        it('should return 1 when date and reference date are in differnt days and difference is less than 24 hrs', () => {
            var fromDate = new Date();
            fromDate.setHours(20, 30, 0, 0, 0);
            var toDate = new Date();
            toDate.setHours(8, 30, 0, 0, 0);
            toDate.setDate(toDate.getDate()+1);
            expect(dateUtil.getDayNumber(fromDate, toDate)).toBe(1);
        });

        it('should return 2 when date and reference date are in differnt days and difference is between 24 hrs to 48 hrs', () => {
            var fromDate = new Date();
            fromDate.setHours(10, 30, 0, 0, 0);
            var toDate = new Date();
            toDate.setHours(18, 30, 0, 0, 0);
            toDate.setDate(toDate.getDate()+1);
            expect(dateUtil.getDayNumber(fromDate, toDate)).toBe(2);
        });
    });

    describe("getEndDateFromDuration", () => {
        it('should return date from a given duration', () => {
            var dateFrom = new Date();
            dateFrom.setHours(0, 0, 0, 0, 0);
            var endDate = new Date();
            endDate.setHours(0, 0, 0, 0, 0);
            endDate.setMonth(endDate.getMonth()+2);
            expect(dateUtil.getEndDateFromDuration(dateFrom, 2, "Months")).toEqual(endDate);
        });
    });

    describe("formatDateWithTime", () => {
        it("should take a long representation of date and format", () => {
            var date = new Date(1427803080000);
            expect(dateUtil.formatDateWithTime("1427803080000")).toEqual(moment(date).format("DD MMM YY h:mm a"));
        });

        it("should take a string representation of date and format", () => {
            var date = new Date();
            expect(dateUtil.formatDateWithTime(moment(date).format(dateFormat))).toEqual(moment(date).format("DD MMM YY h:mm a"));
        });

        it("should not break for undefined and return null", () => {
            expect(dateUtil.formatDateWithTime(undefined)).toBeNull();
        });

        it("should return the original string if it cannot be formatted", () => {
            expect(dateUtil.formatDateWithTime("Recent")).toBe("Recent");
        });
    });

    describe("formatDateWithoutTime", () => {
        it("should take a long representation of date and format", () => {
            var date = new Date(1427803080000);
            expect(dateUtil.formatDateWithoutTime("1427803080000")).toEqual(moment(date).format("DD MMM YY"));
        });

        it("should take a string representation of date and format", () => {
            var date = new Date();
            expect(dateUtil.formatDateWithoutTime(moment(date).format(dateFormat))).toEqual(moment(date).format("DD MMM YY"));
        });

        it("should not break for undefined and return null", () => {
            expect(dateUtil.formatDateWithoutTime(undefined)).toBeNull();
        });

        it("should return the original string if it cannot be formatted", () => {
            expect(dateUtil.formatDateWithoutTime("Recent")).toBe("Recent");
        });
    });

    describe("formatTime", () => {
        it("should take a long representation of date and format", () => {
            var date = new Date(1427803080000);
            expect(dateUtil.formatTime("1427803080000")).toEqual(moment(date).format("h:mm a"));
        });

        it("should take a string representation of date and format", () => {
            var date = new Date();
            expect(dateUtil.formatTime(moment(date).format(dateFormat))).toEqual(moment(date).format("h:mm a"));
        });

        it("should not break for undefined and return null", () => {
            expect(dateUtil.formatTime(undefined)).toBeNull();
        });
        it("should return the original string if it cannot be formatted", () => {
            expect(dateUtil.formatTime("Recent")).toBe("Recent");
        });
    });

    describe("diffInDays", () => {
        it("should return 0 for difference of same date", () => {
            var date = new Date('2015', '7', '14', '12');
            expect(dateUtil.diffInDays(date, date)).toEqual(0);
        });

        it("should return 1 for difference of one day", () => {
            var date = new Date('2015', '7', '14', '12');
            var nextDate = new Date('2015', '7', '15', '12');
            expect(dateUtil.diffInDays(date, nextDate)).toEqual(1);
        });

        it("should return 365 for difference of one year", () => {
            var date = new Date('2014', '7', '15', '12');
            var nextYear = new Date('2015', '7', '15', '12');
            expect(dateUtil.diffInDays(date, nextYear)).toEqual(365);
        });
    });

    describe("getDateWithoutTime", () => {
        it("should return date without time", () => {
            expect(dateUtil.getDateWithoutTime(new Date('2014', '7', '15', '12','30','25'))).toBe('2014-08-15');
        });

        it("should return null if date provided is null", () => {
            expect(dateUtil.getDateWithoutTime(null)).toBe(null);
        });
    });

    describe("getDateWithMonthsAndYears", () => {
        it("should return date with months and years", () => {
           expect(dateUtil.getDateInMonthsAndYears(new Date('2014', '7', '15', '12','30','25'))).toBe('Aug 14');
        });
    });
});
