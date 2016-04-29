var events = [];
var busyFreeDays = [];
var isFirstTime = true;
var selectedDate = null;

var calendar = {
    //init
    loadValidate: function () {
        //add date rule
        jQuery.validator.addMethod("dateGreaterThan", function (value, element, params) {
            if (!/Invalid|NaN/.test(new Date(value))) {
                return new Date(value) > new Date($(params).val());
            }

            return isNaN(value) && isNaN($(params).val())
                || (Number(value) > Number($(params).val()));
        }, 'Must be greater than {0}.');

        //form add event
        $("#form-add-event").validate({
            rules: {
                description: "required",
                date: "required",
            },
            messages: {
                description: "description must not be blank",
                date: "Date must not be blank",
            },
            submitHandler: function () {
                calendar.addEvent();
            }
        });

        //form busy, free day
        $("#form-busy-days").validate({
            rules: {
                fromDate: "required",
                toDate: {
                    required: true,
                    dateGreaterThan: "#fromDate"
                },
                busyDate: "required",
            },
            messages: {
                fromDate: "From date must not be blank",
                toDate: {
                    required: "Till date must not be blank",
                    dateGreaterThan: "To date must greater than from date"
                },
                busyDate: "You must choose days are free or busy",
            },
            submitHandler: function () {
                calendar.setDays();
            }
        });
    },
    initControl: function () {
        $("#form-add-event input[name=date]").datepicker();
        $("#form-busy-days input[name=fromDate],#form-busy-days input[name=toDate]").datepicker();
    },

    //form
    addEvent: function () {
        $("#form-add-event .suc-text").html("");
        $("#form-add-event .err-text").html("");

        var obj = {
            Description: $("#form-add-event input[name=description]").val(),
            Date: $("#form-add-event input[name=date]").val(),
            Busy: $("#form-add-event input[name=maskAsUnavaiable]").is(":checked")
        };

        $.ajax({
            url: "/umbraco/api/ConfectionerCalendar/AddEvent",
            method: "Post",
            data: obj
        }).always(function (response) {
            if (response.Success) {
                $("#form-add-event .suc-text").html("Events successfully added");
                $("#form-add-event input[name=description]").val("");
                $("#form-add-event input[name=date]").val("");
                $("#form-add-event input[name=maskAsUnavaiable]").attr('checked', false);

                obj.Id = response.Data.Id;
                events.splice(0, 0, obj);
                busyFreeDays.push(obj);

                calendar.reloadMainDatepicker();
                calendar.drawEvent();
            } else {
                $("#form-add-event .err-text").html(response.Message);
            }
        });
    },
    setDays: function () {
        $("#form-busy-days .suc-text").html("");
        $("#form-busy-days .err-text").html("");

        var obj = {
            DateFrom: $("#form-busy-days input[name=fromDate]").val(),
            DateTo: $("#form-busy-days input[name=toDate]").val(),
            Busy: $("#form-busy-days input[name=busyDate]").eq(0).is(":checked"),
            Free: $("#form-busy-days input[name=busyDate]").eq(1).is(":checked"),
        };
        $.ajax({
            url: "/umbraco/api/ConfectionerCalendar/SetBusyDate",
            method: "Post",
            data: obj
        }).always(function (response) {
            if (response.Success) {
                $("#form-busy-days .suc-text").html("Set days successfully");
                obj.Id = response.Data.Id;
                busyFreeDays.push(obj);
                calendar.reloadMainDatepicker();

                $("#form-busy-days input[name=fromDate]").val("");
                $("#form-busy-days input[name=toDate]").val("");
                $("#form-busy-days input[name=busyDate]").attr('checked', false);
            } else {
                $("#form-busy-days .err-text").html(response.Message);
            }
        });
    },

    //event datepicker
    reloadMainDatepicker: function () {
        $("#event-datepicker").datepicker({
            todayHighlight: true,
            autoclose: true,
            beforeShowDay: function(d) {
                var busy = null;
                for (var i = 0; i < busyFreeDays.length; i++) {
                    if (busyFreeDays[i].Date && busyFreeDays[i].Busy) {
                        var date = new Date(busyFreeDays[i].Date);
                        date.setHours(0);
                        if (date.getTime() == d.getTime()) {
                            busy = true;
                        }
                    } else {
                        var dateFrom = new Date(busyFreeDays[i].DateFrom);
                        dateFrom.setHours(0);

                        var dateTo = new Date(busyFreeDays[i].DateTo);
                        dateTo.setHours(0);
                        dateTo.setDate(dateTo.getDate() + 1);

                        if (dateFrom.getTime() <= d.getTime() &&
                            d.getTime() <= dateTo.getTime()) {
                            busy = busyFreeDays[i].Busy;
                        }
                    }
                }
                if (busy == null) {
                    return [true, "", ""];
                } else if (busy) {
                    return [true, "busy-day", "Busy"];
                } else {
                    return [true, "free-day", "Free"];
                }

            },
            changeDate: function(date) {
                selectedDate = new Date(date);
                calendar.drawEvent();
            },
            onChangeMonthYear: function(year, month) {
                calendar.loadAllEvent(year, month);
            },
        }).on('changeDate', function(ev) {
            selectedDate = new Date(ev.date);
            calendar.drawEvent();
        });

        if (isFirstTime) {
            isFirstTime = false;
        } else {
            $("#event-datepicker").datepicker("refresh");
        }
    },
    getEventList: function (data) {
        events = [];
        busyFreeDays = [];
        $.each(data, function (index, item) {
            if (item.Date) {
                //event
                events.push(item);
                busyFreeDays.push(item);
            } else {
                //busy days
                busyFreeDays.push(item);
            }
        });
        events.reverse();
    },

    //event table
    loadAllEvent: function (year, month) {
        $.ajax({
            url: "/umbraco/api/ConfectionerCalendar/LoadAllEvent?year=" + year + "&month=" + month,
            method: "Get",
        }).always(function (response) {
            if (response.Success) {
                calendar.getEventList(response.Data);
                calendar.reloadMainDatepicker();
                calendar.drawEvent();
            }
        });
    },
    drawEvent: function () {
        var html = "";
        for (var i = 0; i < events.length; i++) {
            if (selectedDate != null) {
                //load by date
                var eventDate = new Date(events[i].Date);
                eventDate.setHours(0);
                if (selectedDate.getTime() != eventDate.getTime()) {
                    continue;
                }
            }

            html += "<tr>" +
                        "<td>" + new Date(events[i].Date).toLocaleDateString() + "</td>" +
                        "<td>" + events[i].Description + "</td>" +
                        "<td><a data-index='" + i + "'>Remove</a></td>" +
                    "</tr>";
        }
        if (html.length == 0) {
            html = "<tr>" +
                        "<td colspan='3'>No upcoming events</td>" +
                   "</tr>";
        }
        $("#calendar-event").html(html);

        $("#calendar-event a").click(calendar.showConfirmDelete);
    },
    showEvent: function () {
        selectedDate = null;
        calendar.drawEvent();
    },

    //delete
    showConfirmDelete: function (e) {
        $("#confirm-delete-dialog").modal("show");
        $("#event-index").val($(e.currentTarget).data("index"));
    },
    removeEvent: function (e) {
        var index = $("#event-index").val();
        debugger;
        $.ajax({
            url: "/umbraco/api/ConfectionerCalendar/RemoveEvent",
            method: "Post",
            data: events[index]
        }).always(function (response) {
            if (response.Success) {
                for (var i = 0; i < busyFreeDays.length; i++) {
                    if (busyFreeDays[i].Id == events[index].Id) {
                        busyFreeDays.splice(i, 1);
                        break;
                    }
                }

                events.splice(index, 1);

                calendar.drawEvent();
                calendar.reloadMainDatepicker();

                $("#confirm-delete-dialog").modal("hide");
            }
        });
    },
};

$(document).ready(function () {
    calendar.initControl();
    calendar.loadValidate();
    var current = new Date();
    calendar.loadAllEvent(current.getFullYear(), current.getMonth() + 1);

    $("#show-all-event").click(calendar.showEvent);

    $("#delete-event").click(calendar.removeEvent);
});

