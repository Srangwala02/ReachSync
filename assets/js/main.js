function getCookie(cookieName) {
    var name = cookieName + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function InternalServerError() {
    swal({
        title: 'Internal server error',
        text: 'Site is under maintainance,Try againg later',
        imageUrl: "/assets/images/error500.png",
        timer: 3500,
        showConfirmButton: false,
        showCancelButton: false,
    })
}

function InvalidUser() {
    document.cookie = "apikey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    location.href = "/signin";
}

function userNotFound(iid) {
    swal({
        title: `Try to Re-Connect`,
        html: `<span class="text-danger">
                    May be, You are disconnected from instance
                <span>`,
        type: 'error',
        timer: 2000,
        showConfirmButton: false,
    })
    // .then(() => {
    //     $.ajax({
    //         url: "/updateData",
    //         method: "PUT",
    //         data: {
    //             "table": "instance",
    //             "paramstr": `isActive = 0`,
    //             "condition": `instance_id = '${iid}'`
    //         },
    //         success: function (val) {
    //             switch (val.status_code) {
    //                 case '400':
    //                 case '401': {
    //                     InvalidUser();
    //                     break;
    //                 }

    //                 case '404':
    //                 case '500': {
    //                     InternalServerError();
    //                     break;
    //                 }

    //                 case '200': {
    //                     $("#disconnect, #scanqr").addClass("d-none");
    //                     $("#scanqr").removeClass("d-none");
    //                     break;
    //                 }
    //             }
    //         }
    //     })
    // });
}

function chkLogin() {
    const apikey = getCookie("apikey");
    if (apikey == '' || apikey == null) {
        InvalidUser();
    }
    $.ajax({
        url: "/getData",
        method: "POST",
        data: {
            obj: {
                table: `users`,
                paramstr: true
            }
        },
        success: function (val) {
            switch (val.status_code) {
                case '401':
                case '404': {
                    InvalidUser();
                    break;
                }

                case '500': {
                    InternalServerError();
                    break;
                }
            }
        }
    })

    userinfo();
}

function getCheckedCheckboxesFor(checkboxName) {
    var checkboxes = document.querySelectorAll(`input[name="${checkboxName}"]:checked`), values = [];
    Array.prototype.forEach.call(checkboxes, function (el) {
        values.push(el.value);
    });
    return values;
}

function enterKeyEvent(tboxid, clickbtnid) {
    $(`#${tboxid}`).keypress((event) => {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $(`#${clickbtnid}`).click();
        }
    })
}

function userinfo() {
    const apikey = getCookie("apikey");
    $.ajax({
        url: "/getData",
        method: "POST",
        data: {
            obj: {
                table: `users`,
                paramstr: true,
            }
        },
        success: function (val) {
            switch (val.status_code) {
                case '401':
                case '404': {
                    InvalidUser();
                    break;
                }

                case '500': {
                    InternalServerError();
                    break;
                }

                default: {
                    let Obj = {};
                    for (let i = 0; i < val.length; i++) {
                        Object.assign(Obj, val[i]);
                    }
                    if (val.length == 1) {
                        if (Obj.image == null || Obj.image == "") {
                            $('.profileimg').attr('src', `../assets/images/users/user-dummy-img.jpg`);
                        }
                        else {
                            if ((Obj.image).startsWith('http') || (Obj.image).startsWith('https')) {
                                $('.profileimg').attr('src', `${Obj.image}`);
                            }
                            else {
                                $('.profileimg').attr('src', `../assets/upload/profile/${apikey}/${Obj.image}`);
                            }
                        }

                        $('.profilename').html(Obj.uname);
                    }
                }
            }
        }
    })
}

function focusEvent(sourceid, targetid) {
    $(`#${sourceid}`).keypress((event) => {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $(`#${targetid}`).focus();
        }
    })
}

function copy_api(id) {
    var copyText = document.getElementById(id);
    // var copyText = $('#' + id);

    // copyText.select();
    // copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value || copyText.textContent);
}

$(document).ready(function () {
    $(document).on("click", ".copy", function () {
        var param = $(this).attr("id").substring(5);
        copy_api(param);
    });

    let page = document.URL.split("/");

    sessionStorage.setItem(`data-preloader`, `enable`);

    $('.footer').html(`<div class="container-fluid">
                            <div class="row">
                                <div class="col-sm-6">
                                    <span>&copy;<span>
                                    <span>${new Date().getFullYear()}<span>
                                    <span>ReachSync<span>
                                </div>
                                
                            </div>
                        </div>`);
    $(document).on('click', '#logout', function () {
        document.cookie = "apikey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        sessionStorage.removeItem("apikey");
        sessionStorage.removeItem("iid");
        location.href = "/signin";
    });

    switch (page[3]) {
        case 'logs':
        case 'dashboard':
        case 'instance':
        case 'customtemplate':
        case 'support-ticket':
        case 'updateprofile':
        case 'profile':
        case 'subscription':
        case 'addpasscode': {
            fetch('../../assets/json/common-nav.json')
                .then(response => response.json())
                .then(data => {
                    let result = ``;
                    for (var i in data) {
                        result += `
                        <li class="nav-item">
                            <a class="nav-link menu-link" href="/${data[i].link}" data-page="${data[i].link}">
                                <i class="${data[i].icon}"></i>
                                <span data-key="t-dashboards">${data[i].page}</span>
                            </a>
                        </li>`;
                    }
                    $('#navbar-nav').html(result);
                    $(`a[data-page='${page[3]}']`).addClass('active');
                })
                .catch(error => {
                    console.error(error);
                });
            break;
        }

        case 'api':
        case 'docs': {
            fetch('../../assets/json/docs-nav.json')
                .then(response => response.json())
                .then(data => {
                    let result = ``;
                    for (var i in data) {
                        if (data[i].submenu) {
                            result += `
                            <li class="nav-item w-100">
                                <a class="nav-link menu-link" href="#${data[i].link}" data-bs-toggle="collapse"  data-page="${data[i].link}">
                                    <i class="${data[i].icon}"></i>
                                    <span>${data[i].page}</span>
                                </a>
                                <div class="collapse menu-dropdown" id="${data[i].link}">
                                    <ul class="nav nav-sm flex-column">`;

                            for (var j in data[i].submenu) {
                                result += `
                                    <li class="nav-item">
                                        <a href="/docs/${data[i].link}/${data[i].submenu[j].link}" class="nav-link" data-page="${data[i].submenu[j].link}" data-folder="${data[i].page}" data-method="${data[i].submenu[j].method}">
                                            <span class="px-2 py-1 rounded-2 text-bg-success fw-medium me-2 fs-10">
                                                ${data[i].submenu[j].method}
                                            </span>
                                            <span class="d-flex justify-content-end">
                                                ${data[i].submenu[j].name}
                                            </span>
                                        </a>
                                    </li>`;
                            }
                            result += `</ul></div>`;
                        }
                        else {
                            result += `
                            <li class="nav-item w-100">
                            <a class="nav-link menu-link" href="/${data[i].link}" data-page="${data[i].link}">
                            <i class="${data[i].icon}"></i>
                            <span>${data[i].page}</span>
                            </a>
                            </li>`;
                            $(`a[data-page='${page[3]}']`).addClass('active');
                        }
                    }

                    $('#navbar-nav').html(result);
                    (page.length == 4)
                        ? $(`a[data-page='${page[3]}']`).addClass('active')
                        : $(`a[data-page='${page[4]}'], a[data-page='${page[5]}']`).addClass('active');

                    $(`#${page[4]}`).addClass('show');

                    let divid = $(`#${page[4]} :nth-child(1) [data-page='${page[5]}']`);

                    $(`#api_path`).html(`
                                <li class="breadcrumb-item">Docs</li>
                                <li class="breadcrumb-item">${divid.attr('data-folder')}</li>
                                <li class="breadcrumb-item">${divid.attr('data-page')}</li>`);


                })
                .catch(error => {
                    console.error(error);
                });
            break;
        }
    }

    if (page[3] === 'instance') {
        if (page[5]) {
            $.ajax({
                url: "/getData",
                method: "POST",
                data: {
                    obj: {
                        "table": "instance",
                        "paramstr": `instance_id = '${page[4]}'`
                    }
                },
                success: function (val) {
                    if (val[0] && val[0].disabled == 1) {

                        swal({
                            title: "Instance blocked",
                            text: "Contact admin regarding reactivation.",
                            type: 'error',
                            timer: 4000,
                            showConfirmButton: false,
                        }).then(() => {
                            location.href = "/instance";
                        });
                    }
                }
            })

            switch (page[5].split('?')[0]) {
                case 'logs':
                case 'bulkmessage':
                case 'bulkmail':
                case 'contact-list':
                case 'channel':
                case 'individualworkflow':
                case 'workflow':
                case 'chat': {
                    fetch('../../assets/json/common-nav.json')
                        .then(response => response.json())
                        .then(data => {
                            let result = ``;
                            for (var i in data) {
                                if (data[i].submenu) {
                                    result += `
                                    <li class="nav-item">
                                        <a class="nav-link menu-link" href="/${data[i].link}" data-page="${data[i].link}">
                                            <i class="${data[i].icon}"></i>
                                            <span data-key="t-dashboards">${data[i].page}</span>
                                        </a>
                                        <ul class="nav nav-sm flex-column fs-15" id="instance_page_menu">`;
                                    for (var j in data[i].submenu) {
                                        result += `
                                            <li class="nav-item">
                                                <a class="nav-link menu-link" href="/instance/${document.URL.split("/")[4]}/${data[i].submenu[j].link}" data-page="${data[i].submenu[j].link}">
                                                    <i class="${data[i].submenu[j].icon}"></i>
                                                    <span data-key="t-dashboards">${data[i].submenu[j].page}</span>
                                                </a>
                                            </li>`;
                                    }
                                    result += `</ul></li>`;
                                }
                                else {
                                    result += `
                                    <li class="nav-item">
                                        <a class="nav-link menu-link" href="/${data[i].link}" data-page="${data[i].link}">
                                            <i class="${data[i].icon}"></i>
                                            <span data-key="t-dashboards">${data[i].page}</span>
                                        </a>
                                    </li>`;
                                }
                            }
                            $('#navbar-nav').html(result);
                            $(`a[data-page='${page[3]}'],a[data-page='${page[5]}']`).addClass('active');
                        })
                        .catch(error => {
                            console.error(error);
                        });

                    $.ajax({
                        url: "/getData",
                        method: "POST",
                        data: {
                            obj: {
                                table: "instance",
                                // paramstr: `disabled = 0`,
                                paramstr: `true`,
                            }
                        },
                        success: function (val) {
                            const iid = document.URL.split("/")[4];
                            var data = "";
                            switch (val.status_code) {
                                case '401': {
                                    InvalidUser();
                                    break;
                                }

                                case '500': {
                                    InternalServerError();
                                    break;
                                }
                                case '404': {
                                    break;
                                }

                                default: {
                                    data += `<div class="btn-group">`;
                                    for (i in val) {
                                        if (val[i].instance_id == iid) {
                                            data += `<button type="button" class="btn btn-sm btn-white dropdown-toggle m-0 p-0 text-primary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><strong>${val[i].i_name}<strong></button>`;
                                        }
                                    }

                                    data += `<div class="dropdown-menu">`;
                                    for (i in val) {
                                        if (val[i].instance_id != iid) {
                                            if (val[i].disabled == 0) {
                                                data += `<a class="dropdown-item text-primary" href="${document.URL.replace(iid, val[i].instance_id)}">
                                                    <i class="ri-checkbox-circle-line align-middle text-success me-2"></i>
                                                    ${val[i].i_name}
                                                </a>`;
                                            } else {
                                                data += `<div class="dropdown-item text-primary opacity-50" style="user-select: none; cursor: not-allowed;">
                                                    <i class="ri-close-circle-line align-middle text-danger me-2"></i>
                                                    ${val[i].i_name}
                                                </div>`;
                                            }
                                        }
                                    }
                                    data += `</div></div>`
                                    $('#i_name').html(data);
                                }
                            }
                        }
                    });
                    break;
                }
            }
        }
    }

    $(document).on('click', '.light-dark-mode', () => {
        // $('.logo-light,.logo-dark').addClass('d-none');
        if (sessionStorage.getItem("data-layout-mode") == "dark") {
            // $('.logo-dark').removeClass('d-none');
            sessionStorage.setItem("data-layout-mode", "light")
        } else {
            // $('.logo-light').removeClass('d-none');
            sessionStorage.setItem("data-layout-mode", "dark")
        }
    })
    $(document).on('click', '#topnav-hamburger-icon', () => {
        if (sessionStorage.getItem("data-sidebar-size") == "lg") {
            sessionStorage.setItem("data-sidebar-size", "sm")
        } else {
            sessionStorage.setItem("data-sidebar-size", "lg")
        }
    })
})