function showLoading(elementName, style) {
    $('<i class="fa fa-spinner fa-spin" style="position: absolute;font-size: 18px;' + style + '"></i>').insertAfter(elementName);
}
function RemoveLoading() {
    $('.fa-spinner').remove();
}
$(document).ready(function () {
    $('.nav-drop').click(function () {
        if ($(this).hasClass('active-drop')) {
            $(this).removeClass('active-drop');
        }
        else {
            $('.nav-drop').removeClass('active-drop');
            $(this).addClass('active-drop');
        }
    });
    $('html').niceScroll({
        cursorcolor: "#000",
        cursorborder: "0px solid #fff",
        railpadding: {
            top: 0,
            right: 0,
            left: 0,
            bottom: 0
        },
        cursorwidth: "10px",
        cursorborderradius: "0px",
        cursoropacitymin: 0.2,
        cursoropacitymax: 0.8,
        boxzoom: true,
        horizrailenabled: false,
        zindex: 9999
    });
    $('.i-check, .i-radio').iCheck({
        checkboxClass: 'i-check',
        radioClass: 'i-radio'
    });
    $("#updateDetail").click(function () {
        showLoading(this, '');
    })

    //show and hide tab when edit
    $('.edit-table').click(function () {
        $('.display-group').show();
        $(this).parents('.display-group').hide();
    });
    $('.cancel-table').click(function () {
        $(this).parents('.table-line').find('.display-group').show()
    });
});


