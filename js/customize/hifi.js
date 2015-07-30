/**
 * Created by caoliuxue on 15/3/19.
 */

//var categoryt = [
//    {"name": "耳塞耳机", "sub_cat": ["动圈式耳塞", "动圈式耳塞", "圈铁混合耳塞", "动圈耳机", "平板式耳机", "静电耳机"]},
//    {"name": "音箱", "sub_cat": ["有源书架音箱", "无源书架音箱", "有源落地音箱", "无源落地音箱", "无源音箱", "低音炮", "影院系统"]},
//    {"name": "放大器", "sub_cat": ["台式耳机放大器", "便携耳机放大器", "合并式功放", "前级功放", "后级功放", "静电式耳机放大器"]},
//    {"name": "音源", "sub_cat": ["CD/SACD机", "DAC", "随身播放器", "HIFI手机", "数字播放器", "解码耳放一体机"]},
//    {"name": "附件", "sub_cat": ["线材", "器材架", "避震", "电源处理", "耳机耳塞配件", "接插件", "声学环境配件"]}
//];

/**
 * 本地存储
 * @type {Storage}
 */
var localStorage = window.localStorage;
Storage.prototype._getItem = function (key) {
    return localStorage.getItem(key) == null ? "" : localStorage.getItem(key);
};
var _UUID = "";
/**
 * 常量数组
 */
var constants = {
    _UUID: "uuid",
    _USERNAME: "username",
    _PASSWORD: "password",
    _TOKEN_KEY: "token_key",
    _LAST_LOGIN_TIME: "last_login_time",
    _LAST_LOGIN_MILLION_SECONDS: "last_login_million_second",
    hostURL: "http://123.57.216.21:80/hifi-shop/"
};


/**
 * 百度JS IP定位
 */
var baidu_cityName = "";

var user = new HiFiUser();
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        //settings.url=encodeURIComponent(settings.url);
        if (!user.isNewUser()) {
            if (!user.isAutoLogin && !user.isTokenKeyValidate()) {
                user.isAutoLogin = true;
                user.local_login();
            }
        }
    }
});

if ($.isEmptyObject(localStorage.getItem(constants._UUID))) {
    _UUID = getUUIDCompact();
    localStorage.setItem(constants._UUID, _UUID);
} else {
    _UUID = localStorage.getItem(constants._UUID);
}

function getUUIDCompact() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};


/**
 * /**
 * 首页新闻评测
 * @constructor
 */
function News() {
    return {

        topNewsContainer: $("#top_news"),
        topNewsArticleSet: null,
        //comment_API: new Comments(),

        initTopNews: function () {
            var that = this;
            $.mobile.loading("show");
            $.mobile.pageContainer.on("pagecontainerchange", function (event, ui) {
                if (ui.toPage[0].id == "news-content") {
                    new newsContent().goToNewsContent(ui.options.articleid);
                    console.log("after pagecontainerchange", ui.options.articleid);
                } else if (ui.toPage[0].id == "qrl-login") {
                    new QuickLogin().initPage();
                    console.log("after pagecontainerchange", ui.options.articleid);
                }
                console.log("I'm kidding in news init");
            }).on("pagecontainerchangefailed", function (event, ui) {
                if (ui.toPage[0].id == "news-content") {
                    //new newsContent().goToNewsContent(ui.options.articleid);
                    console.log("after pagecontainerchangefailed", ui);
                }
                console.log("I'm kidding in pagecontainerchangefailed");
            }).on("pagecontainerbeforeshow", function (event, ui) {
                if (ui.toPage[0].id == "news-content") {
                    //new newsContent().goToNewsContent(ui.options.articleid);
                    console.log("after pagecontainerbeforeshow", ui);
                }
                console.log("I'm kidding in pagecontainerbeforeshow");
            });
            if (null == that.topNewsArticleSet) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "/app/article/findArticleByFlagType.action",
                    data: {"flagType": 4, "currentPage": 1, "lineSize": 4},
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function (data) {
                        $.mobile.loading('hide');
                        if (null != data && data.length > 0) {
                            that.topNewsArticleSet = data;//根目录
                            console.log(data);
                            that.renderTopNews();
                        } else {
                            //TODO
                        }
                    }
                });
            } else {
                that.renderTopNews();
            }
        },

        /**
         * <div class="swiper-slide"
         style="background-image:url(image/s1.jpg);background-position: center;background-repeat: no-repeat;"></div>
         */
        renderTopNews: function () {
            var that = this;
            $.each(that.topNewsArticleSet, function (i) {
                var div = $("<div class='swiper-slide'></div>");
                that.topNewsContainer.append(div);
                var news_img_title = that.topNewsArticleSet[i].title;
                var news_img_content_title = $("<div class='title'></div>");
                news_img_content_title.html(news_img_title);
                var news_img_content = $("<div class='images-content'></div>");
                news_img_content.append(news_img_content_title);
                var news_img = $("<img/>");
                news_img.attr("src", constants.hostURL + that.topNewsArticleSet[i].mainpicture);
                div.append(news_img);
                div.append(news_img_content);
                div.click(function () {
                    that.readyGoToNewsContent(that.topNewsArticleSet[i]);
                });
            });
            var swiper = new Swiper('.swiper-container', {
                pagination: '.swiper-pagination',
                paginationClickable: true,
                spaceBetween: 30,
                centeredSlides: true,
                autoplay: 2500,
                autoplayDisableOnInteraction: false
            });
        },

        /**
         * 新闻下方瀑布展示区构造
         */
        currentPage: 1,
        lineSize: 20,
        hasMore: true,
        //publishedNewsContainer: $("#content"),
        publishedNewsBlockA: $("#ui-block-a"),
        publishedNewsBlockB: $("#ui-block-b"),
        getPublishedNews: function () {
            var that = this;
            $.mobile.loading("show");
            if (that.hasMore) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "/app/article/findArticleByFlagType.action",
                    data: {"flagType": 2, "currentPage": that.currentPage, "lineSize": that.lineSize},
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function (data) {
                        $.mobile.loading('hide');
                        if (null != data && data.length > 0) {
                            if (data.length == that.lineSize) {
                                that.currentPage = +1;
                            } else {
                                that.hasMore = false;
                            }
                            that.renderPublishedNews(data);
                        } else {
                            alert("没有新的文章了");
                        }
                    }
                });
            }
        },

        isLeft: true,
        renderPublishedNews: function (publishedNews) {
            var that = this;
            $.each(publishedNews, function (i) {
                var container = $("<div class='index-news-container'></div>");
                var wrapper = $("<div class='images-wrapper'></div>");
                var news_img = $("<img/>");
                news_img.attr("src", constants.hostURL + publishedNews[i].mainpicture);
                var textContainer = $("<div class='images-content'></div>");
                var title = $("<div class='title'>" + publishedNews[i].title + "</div>");
                var content = $("<div class='content'>" + publishedNews[i].tipcontent + "</div>");
                var show = $("<div class='show'>"
                    + "<img src='image/like_show.png' class='like_show' /> " + publishedNews[i].likeCount
                    + "<img src='image/message_show.png' class='message_show' /> " + publishedNews[i].commentCount + "</div>");
                textContainer.append(title);
                textContainer.append(show);
                wrapper.append(news_img);
                wrapper.append(textContainer);
                container.append(wrapper);
                container.tap(function () {
                    that.readyGoToNewsContent(publishedNews[i]);
                });
                if (that.isLeft) {
                    that.isLeft = false;
                    that.publishedNewsBlockA.append(container);
                } else {
                    that.isLeft = true;
                    that.publishedNewsBlockB.append(container);
                }
                that.recalculateDivHeight();
            });
        },

        /**
         * 重新计算加载更多是位置
         */
        recalculateDivHeight: function () {
            var that = this;
            if (that.publishedNewsBlockA.height() < that.publishedNewsBlockB.height()) {

            } else {

            }
        },


        /**
         * 进入新闻详细
         * @param publishedNews
         */
        likeCount: $("#likeCount"),
        readyGoToNewsContent: function (publishedNews) {//app/article/findArticleById.action
            $.mobile.pageContainer.pagecontainer("change", "newsContent.html#news-content", {
                type: "get",
                articleid: publishedNews.articleid
            });
        }
    }
}


/**
 *
 * @returns {{articleid: null, likeCount: (*|jQuery|HTMLElement), goToNewsContent: Function}}
 */
function newsContent() {


    return {

        articleid: null,

        goToNewsContent: function (articleid) {//app/article/findArticleById.action
            var that = this;
            if ($.isEmptyObject(articleid)) {
                that.articleid = localStorage.getItem("current_articleid");
                console.log("I get articleid from cookie");
            } else {
                that.articleid = articleid;
                localStorage.setItem("current_articleid", articleid);
            }
            var newsContentImageContainer = $("#news-content-image-container");
            var newsContentTitleContainer = $("#news-content-title-container");
            var newsContentContentContainer = $("#news-content-content-container");
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/article/findArticleById.action",
                data: {"articleId": that.articleid},
                dataType: "json",
                success: function (data) {
                    $.mobile.loading('hide');
                    if (data.code == 0) {
                        var news_img = $("<img/>");
                        news_img.attr("src", constants.hostURL + data.response.article.mainpicture);
                        newsContentImageContainer.html("");
                        newsContentImageContainer.html(news_img);
                        newsContentTitleContainer.html("");
                        newsContentTitleContainer.html(data.response.article.title);
                        newsContentContentContainer.html("");
                        newsContentContentContainer.html(data.response.article.contentvalue);
                        $("#likeCount").text("( " + data.response.article.likeCount + " )");
                    } else {
                        alert(data.msg);
                    }
                }
            });
            that.getNewsComments(that.articleid);
            $("#comments_load_more_a").click(function () {
                that.getNewsComments(that.articleid);
            });
            var doLikeBtn = $("#doLike");
            doLikeBtn.unbind();
            doLikeBtn.click(function () {
                that.doLike(that.articleid);
            });
        },

        doLikeBtn: $("#doLike"),
        doLike: function () {//_UUID article/likeArticle.action
            var that = this;
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/article/likeArticle.action",
                data: {
                    "articleId": that.articleid,
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                    "deviceId": _UUID
                },
                dataType: "json",
                success: function (data) {
                    if (data.code == 0) {
                        $("#likeCount").text("( " + data.response + " )");
                    } else {
                        alert(data.msg);
                    }
                }
            });

        },


        /**
         * 静默加载评论
         */

        comment_currentPage: 1,
        comment_lineSize: 10,
        current_news: null,
        go2doCommentBtn: $("#go2doComment"),

        getNewsComments: function (articleid) {//PASS
            var that = this;
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/comment/findCommentsByArticle.action",
                data: {
                    "articleId": that.articleid,
                    "currentPage": that.comment_currentPage,
                    "lineSize": that.comment_lineSize
                },
                dataType: "json",
                success: function (data) {
                    console.log(data.response.page);
                    that.renderCommentPage(data.response, articleid);
                }
            });
        },

        comment_list: $("#comment_list"),
        comment_loadMore: $("#comments_load_more"),
        commentCount: $("#commentCount"),
        renderCommentPage: function (data) {//PASS
            var that = this;
            if (that.comment_currentPage == 1) {
                that.comment_list.find(".list_item").remove();//清空旧的评论
            }
            var heads = data.head;
            var commentRst = data.page.result;
            var hasNextPage = data.page.hasNextPage;
            that.commentCount.text("( " + data.page.totalItems + " )");
            if (!$.isEmptyObject(commentRst) && commentRst.length > 0) {
                $.each(commentRst, function (i) {
                    var comment_li = $("<li class='list_item'></li>");
                    var image = $("<img/>");
                    var src = heads[commentRst[i].replyorcommentuserid];
                    image.attr("src", constants.hostURL + src);
                    var button = $("<button class='ui-btn'>回复</button>");
                    button.tap(function () {
                        that.replyComment(commentRst[i], that.articleid)
                    });
                    var replier_name = $("<h2>" + commentRst[i].replyorcommentusername + "</h2>");
                    var attr = $("<p class='floor'>" + (i + 1 + (that.comment_currentPage - 1) * that.comment_lineSize) + "楼 " + commentRst[i].posttime + "</p>")
                    var comment_content;
                    try {
                        comment_content = $("<p>" + decodeURIComponent(commentRst[i].commentcontent) + "</p>");
                    } catch (ex) {
                        console.log("非Encode编码无法解析，直接输出:", commentRst[i].commentcontent)
                        comment_content = $("<p>" + commentRst[i].commentcontent + "</p>");
                    }
                    comment_li.append(image, button, replier_name, attr, comment_content);
                    that.comment_loadMore.before(comment_li);
                });
                if (commentRst.length == that.comment_lineSize) {
                    that.comment_currentPage += 1;
                }
            }
            try {
                that.comment_list.listview("refresh");
            } catch (e) {
                that.comment_list.listview();
                //console.log(e);
            }
            that.go2doCommentBtn.unbind();
            that.go2doCommentBtn.tap(function () {
                that.go2doComment();
            });
            if (!hasNextPage) {
                that.comment_loadMore.hide();
            } else {
                that.comment_loadMore.show();
            }
        },

        go2doComment: function (atInfo) {
            var that = this;
            $.mobile.pageContainer.on("pagecontainerchange", function (event, ui) {//定义页面切换事件回调函数
                var gotAtInfo = ui.options.atInfo;
                if (ui.toPage[0].id == "do_comments") {
                    var comment_submitBtn = $("#submit_comment");
                    comment_submitBtn.unbind();
                    comment_submitBtn.tap(function () {
                        that.submitComment(that.articleid);
                    });
                    $("#edit_comment").val("");
                    if ($.isEmptyObject(gotAtInfo)) {
                        $("#replied").text("");
                    } else {
                        $("#replied").text(gotAtInfo);
                    }

                }
                console.log("I'm kidding in go2doComment");
            });
            $.mobile.pageContainer.pagecontainer("change", "do_comments.html", {
                type: "get",
                atInfo: atInfo
            });
        },

        replyComment: function (comment) {
            var that = this;
            console.log("comment detail:", comment);
            if (!$.isEmptyObject(comment)) {
                //window.location.href = "index.html#do_comments";
                var atInfo = "// 回复" + comment.replyorcommentusername;
                try {
                    atInfo += ":" + decodeURIComponent(comment.commentcontent);
                } catch (ex) {
                    console.log("非Encode编码无法解析，直接输出:", comment.commentcontent);
                    atInfo += ":" + comment.commentcontent;
                }
                //$("#replied").text(atInfo);
                that.go2doComment(atInfo);
                //var comment_submitBtn = $("#submit_comment");
                //comment_submitBtn.unbind();
                //comment_submitBtn.tap(function () {
                //    that.submitComment(that.articleid);
                //});
            }
        },

        submitComment: function () {//comment/addArticleComment.action
            $.base64.utf8encode = true;
            var that = this;
            var user = new HiFiUser();
            if (user.isTokenKeyValidate()) {
                var edit_comment = $("#edit_comment");//输入框
                edit_comment.focus();
                if ($.isEmptyObject(edit_comment.val())) {
                    alert("请输入评论内容");
                    return;
                }
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "/app/comment/addArticleComment.action",
                    contentType: "application/x-www-form-urlencoded; charset=utf-8",
                    data: {
                        "articleId": that.articleid,
                        "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                        "userName": $.base64.decode(localStorage.getItem(constants._USERNAME)),
                        "content": encodeURIComponent(edit_comment.val() + $("#replied").text())
                    },
                    dataType: "json",
                    success: function (data) {
                        if (data.code == 0) {
                            window.history.back();
                            edit_comment.val("");
                            that.comment_currentPage = 1;
                            that.getNewsComments(that.current_news);
                        } else if (data.code == 1) {
                            alert(data.msg);
                        }
                        console.log("评论返回数据", data);
                    }
                });
            } else {
                new QuickLogin().initQRL();
            }
        }
    }
}


/**
 * 产品目录相关
 */

function Category() {
    return {

        category_grade0: null,//一级目录
        category_grade1: null,//所有二级目录缓存
        category_grade1_map: new Map(),
        category_container: $("#category"),
        product_list_container: $("#product_list_container"),
        primary_cat_container: $("#primary_cat_container"),
        backToCategory: $("#backToCategory"),

        /**
         * 获取一级目录
         */
        nav_p: function () {
            var that = this;
            $.mobile.loading("show");
            $.mobile.pageContainer.on("pagecontainerchange", function (event, ui) {
                if (ui.toPage[0].id == "do_comments_p") {
                    that.init_comment_p(ui.options);//goodsId
                    console.log("after goto do_comments_p", ui.options.articleid);
                } else if (ui.toPage[0].id == "qrl-login") {
                    new QuickLogin().initPage();
                    console.log("after qrl-login", ui.options.articleid);
                }
                console.log("I'm kidding in news init");
            });
            if (null == that.category_grade0) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "app/goods/findCategoryByGrade.action",
                    data: {"grade": 0},
                    dataType: "json",
                    //jsonp: "callback",
                    success: function (data) {
                        $.mobile.loading('hide');
                        if (null != data && data.length > 0) {
                            that.category_grade0 = data;//根目录
                            console.log(data);
                            that.nav_p_1();
                        } else {
                            //TODO
                        }
                    }
                });
            } else {
                that.nav();
            }
        },

        /**
         * 一级目录获取成功之后，获取二级目录，然后生成页面元素
         */
        nav_p_1: function () {
            var that = this;
            $.mobile.loading("show");
            if (null == that.category_grade1) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "app/goods/findCategoryByGrade.action",
                    data: {"grade": 1},
                    dataType: "json",
                    success: function (data) {
                        $.mobile.loading('hide');
                        if (null != data && data.length > 0) {
                            that.category_grade1 = data;
                            console.log(data);
                            that.nav();
                        } else {
                            //TODO
                        }
                    }
                });
            } else {
                that.nav();
            }
        },


        /**
         * 生成页面一二级目录元素
         */
        nav: function () {
            var that = this;
            that.primary_cat_container.empty();
            $.each(that.category_grade0, function (i) {
                //先生成一级目录div
                var primary_div = $("<div data-role='collapsible' id='div" + that.category_grade0[i].goodsCategoryTid + "'></div>");
                var h3 = $("<h3>" + that.category_grade0[i].name + "</h3>")
                primary_div.append(h3);
                //生成二级目录
                var sub_ul = $("<ul data-role='listview' ></ul>");
                $.each(that.category_grade1, function (j) {
                    if (that.category_grade1[j].parentId == that.category_grade0[i].goodsCategoryTid) {
                        var li = $("<li></li>");
                        var a = $("<a href='#'>" + that.category_grade1[j].name + "</a>");
                        a.tap(function () {
                            that.currentPage = 1;
                            that.getProductsList(that.category_grade1[j]);
                        });
                        li.append(a);
                    }
                    sub_ul.append(li);
                });
                sub_ul.listview();
                primary_div.append(sub_ul);
                that.primary_cat_container.append(primary_div);
            });
            that.primary_cat_container.collapsibleset();
            $(document).on('pagebeforeshow', '#product_list_container', function () {//绑定搜索按钮事件
                    that.doSearchBtn.unbind();
                    that.doSearchBtn.click(function () {
                        //TODO set search method here
                        that.currentPage = 1;
                        that.filterRst = null;
                        that.doGoodsFilter(that.filterLoadFrom.SEARCH);
                    });
                    that.markSort();
                }
            );
        },


        /**
         *根据categoryID查找产品列表
         * @param category
         */
        currentSubCategory: null,
        currentPage: 1,
        lineSize: 5,
        hasMore: true,
        doSearchBtn: $("#doSearch"),
        getProductsList: function (category) {
            var that = this;
            this.currentSubCategory = null != category ? category : this.currentSubCategory;
            $.mobile.loading("show");
            $.ajax({
                type: "POST",
                url: constants.hostURL + "app/goods/findGoodsByCategory.action",
                data: {
                    "grade": 1,
                    "goodsCategoryTid": that.currentSubCategory.goodsCategoryTid,
                    "currentPage": that.currentPage,
                    "lineSize": that.lineSize
                },
                dataType: "json",
                //jsonp: "callback",
                success: function (data) {
                    $.mobile.loading('hide');
                    that.renderProductList(data);
                }
            });
        },

        clearProduct: function () {
            this.products_list.empty();
        },

        /**
         * 构建过滤器，所有都是动态的，MLGB
         */
        getFilterDataStructure: function () {//goods/findAttriByEndCategory.action
            var that = this;
            if ($.isEmptyObject(that.filterList)) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "app/goods/findAttriByEndCategory.action",
                    data: {
                        "goodsCategoryTid": that.currentSubCategory.goodsCategoryTid
                    },
                    dataType: "json",
                    //jsonp: "callback",
                    success: function (data) {
                        console.log("filter Data:", data);
                        if (data.code == 0) {
                            that.genFilter(data.response);
                        }
                    }
                });
            }
        },

        filterList: null,
        brandList: null,
        attrList: null,
        brand_sel_container: $("#filter_brand_div"),
        brand_sel: $("#filter_brand"),
        doFilterBtn: $("#doFilterBtn"),
        restFilterBtn: $("#restFilter"),
        genFilter: function (resp) {
            var that = this;
            that.filterList = resp;
            that.brandList = resp.brand;
            that.attrList = resp.attr;
            console.log(that.attrList);
            that.brand_sel.empty();
            that.brand_sel.append("<option>全部</option>");
            $.each(that.brandList, function () {//品牌筛选部分
                console.log(this);
                var option = $("<option value = " + this.brandId + ">" + this.brandName + "</option>")
                that.brand_sel.append(option);
                that.brand_sel.selectmenu("refresh");
            });
            $(".ui-field-contain:gt(0)").remove();
            if (!$.isEmptyObject(that.attrList)) {
                $.each(that.attrList, function () {
                    var attr = this;
                    var attrValues = attr.attriValues;
                    console.log(attr);
                    if (!$.isEmptyObject(attrValues) && attrValues.length > 0) {
                        var attr_div = $("<div class='ui-field-contain' id='attr_" + attr.attriId + "_div'></div>");
                        var attr_label = $("<label for='attr_" + attr.attriId + "'>" + attr.attriName + "</label>");
                        var attr_sel = $("<select id='attr_" + attr.attriId + "' multiple='multiple' data-native-menu='false'></select>")
                        attr_sel.append("<option selected='selected'>全部</option>");
                        $.each(attrValues, function (i) {
                            var attr_option = $("<option value='" + attrValues[i] + "'>" + attrValues[i] + "</option>");
                            attr_sel.append(attr_option);
                        });
                        attr_div.append(attr_label.append(attr_sel));
                        that.brand_sel_container.after(attr_div);
                        try {
                            attr_sel.selectmenu("refresh");//多选构造函数
                        } catch (ex) {
                            attr_sel.selectmenu();
                        }

                    }
                });
            }
            that.doFilterBtn.unbind();
            that.doFilterBtn.tap(function () {
                //that.filterList = null;
                that.currentPage = 1;
                that.filterRst = null;
                that.doGoodsFilter(that.filterLoadFrom.OKBUTTON);
            });
            that.restFilterBtn.unbind();
            that.restFilterBtn.tap(function () {
                that.filterList = null;
                that.currentPage = 1;
                that.filterRst = null;
                that.getFilterDataStructure();
            });

        },

        sort_userSel: {
            "sort_price": "price asc",
            "sort_comment": "commentcount asc",
            "sort_recommend": "recommended asc"
        },
        sortBase: {
            "sort_price": {"up": "price asc", "down": "price desc"},
            "sort_comment": {"up": "commentcount asc", "down": "commentcount desc"},
            "sort_recommend": {"up": "recommended asc", "down": "recommended desc"}
        },
        active_sort: "",
        markSort: function () {
            var that = this;
            var sort_lis = $("#sort_ul").find("a");
            sort_lis.unbind();
            sort_lis.each(function () {
                $(this).tap(function () {
                    var el_id = this.id;//data-icon="arrow-u"
                    that.active_sort = el_id;
                    if (that.sort_userSel[el_id] == that.sortBase[el_id].up) {
                        $(this).attr("data-icon", "arrow-d");
                        that.sort_userSel[el_id] = that.sortBase[el_id].down;
                    } else {
                        $(this).attr("data-icon", "arrow-u");
                        that.sort_userSel[el_id] = that.sortBase[el_id].up;
                    }
                    try {
                        $("#sort_ul").navbar( "refresh" );
                    } catch (ex) {

                    }
                    console.log(that.active_sort, that.sort_userSel[el_id]);
                });
            });
        }
        ,

        /**
         * 获取过滤器中各个属性的选择情况
         * @returns {{attrFilter: string, brandFilter: string, keyWordFilter: string, sortStr: string}}
         */
        getFilterSetting: function () {
            var that = this, filterSettings = {
                "attrFilter": "",
                "brandFilter": "",
                "keyWordFilter": $("#product-list-search").val(),
                "sortStr": that.sort_userSel[that.active_sort]
            };
            var brandOptions = $("#filter_brand-menu").find("li");
            brandOptions.each(function () {//data-option-index
                var option = $(this);
                var index = option.attr("data-option-index");//$('.dropdown option').eq(1).val()
                filterSettings.brandFilter += option.attr("aria-selected") == "true" ? ($('#filter_brand option').eq(index).val() + ",") : "";
            });
            filterSettings.brandFilter = filterSettings.brandFilter.substr(0, filterSettings.brandFilter.length - 1);

            var filterObj = {};
            $.each(that.attrList, function () {
                var attr = this;
                //filterSettings.attrFilter += that.getSelectedOptions(attr.attriId);
                $.extend(filterObj, that.getSelectedOptions(attr.attriId));
            });
            filterSettings.attrFilter = JSON.stringify(filterObj)
            console.log("filterSettings", filterSettings);

            return filterSettings;
        }
        ,


        /**
         * 获取给定select menu的选中值拼接串
         * @param attrID
         * @returns {string}
         */
        getSelectedOptions: function (attrID) {
            var optAttrSelectMenu = $("#attr_" + attrID + "-menu");
            var attrFilter = {};
            attrFilter[attrID] = [];
            var options = optAttrSelectMenu.find("li");
            options.each(function () {
                var option = $(this);
                if (option.attr("aria-selected") == "true") {
                    attrFilter[attrID].push(this.textContent);
                    console.log(attrID, this.textContent);
                }
            });
            if (attrFilter[attrID].length > 0) {
                return attrFilter;
            } else {
                return {};
            }
        }
        ,

        /**
         * 根据选择的过滤条件进行过滤
         */
        filterRst: null,
        isFiltering: false,
        filterLoadFrom: {
            LOADMORE: 0, OKBUTTON: 1, SEARCH: 2
        }
        ,
        doGoodsFilter: function (from) {
            $("#right-panel").panel("close");
            var that = this, filterSetting = that.getFilterSetting();
            that.isFiltering = true;
            $.ajax({
                type: "POST",
                url: constants.hostURL + "app/goods/filterGoods.action",
                data: {
                    "goodsCategoryTid": that.currentSubCategory.goodsCategoryTid,
                    "attrFilter": filterSetting.attrFilter,
                    "brandFilter": filterSetting.brandFilter,
                    "keyWordFilter": filterSetting.keyWordFilter,
                    "currentPage": that.currentPage,
                    "sortStr": filterSetting.sortStr
                },
                dataType: "json",
                success: function (data) {
                    console.log("filter Data:", data);
                    if (data.code == 0) {
                        that.filterRst = data;
                        that.currentPage = data.response.page.pageNo;
                        that.lineSize = data.response.page.pageSize;
                        that.renderProductList(data.response.page.result);
                    }
                }
            });
        }
        ,

        /**
         * 开始构造产品目录列表
         */
        products_list: $("#theList"),
        loadMore: null,
        renderProductList: function (productList) {
            var that = this;
            if (productList.length > 0) {
                that.getFilterDataStructure();
                if (that.currentPage == 1) {//如果是第一次或者是重新搜索的话，需要初始化listview
                    window.location.href = "category.html#product_list_container";
                    that.products_list.empty();
                    that.loadMore = $("<li id='loadMore'><h2>加载更多</h2></li>");
                    that.products_list.append(that.loadMore);
                }
                $.each(productList, function (i) {
                    var li = $("<li></li>");
                    var a = $("<a href='#'></a>");
                    var img = $("<img>");
                    img.attr("src", constants.hostURL + productList[i].pictureurl);
                    var h2 = $("<h2>" + productList[i].goodsname + "</h2>");
                    var p = $("<p>" + productList[i].goodsname + "</p>");
                    a.append(img, h2, p);
                    a.tap(function () {
                        that.fetchProductDetail(productList[i]);
                    });
                    li.append(a);
                    that.loadMore.before(li);
                });
                try {
                    that.products_list.listview("refresh");
                } catch (ex) {
                    console.log(ex);
                }

                that.loadMore.unbind();
                if (productList.length < that.lineSize) {
                    that.loadMore.find("h2").text("没有更多了");
                } else {
                    that.currentPage += 1;
                    //绑定加载更多事件
                    that.loadMore.tap(function () {
                        if (that.isFiltering) {
                            that.doGoodsFilter(that.filterLoadFrom.LOADMORE);
                        } else {
                            that.getProductsList();
                        }
                    });
                }
            } else {
                if (that.currentPage == 1) {
                    if (that.isFiltering) {
                        alert("没有符合条件的商品");
                    } else {
                        alert("该目录下暂无商品");
                    }

                } else {
                    that.hasMore = false;
                    that.loadMore.find("h2").text("没有更多了");
                    alert("没有更多了");
                }
            }
        }
        ,

        /**
         * 抓取产品详细数据
         */
        fetchProductDetail: function (product) {
            var that = this;
            $.mobile.loading('show');
            $.ajax({
                type: "POST",
                url: constants.hostURL + "app/goods/findGoodById.action",
                data: {
                    "goodsid": product.goodsid,
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                    "deviceId": _UUID
                },
                dataType: "json",
                //jsonp: "callback",
                success: function (product_detail) {
                    $.mobile.loading('hide');
                    if (null != product_detail) {
                        that.renderProductDetail(product_detail);
                    } else {
                        alert("获取详细失败，稍后重试");
                    }
                }
            });
        }
        ,

        /**
         * 展现产品详情
         */
        product_title: $("#product_detail_title_container"),
        product_image: $("#product_detail_image_container"),
        product_content: $("#product_detail_content_container"),
        rating_score: $("#rating_score"),
        go2doPComment: $("#go2doPComment"),
        renderProductDetail: function (product_detail) {
            var that = this;
            window.location.href = "category.html#product_detail";
            that.product_title.empty();
            that.product_image.empty();
            that.product_content.empty();

            that.go2doPComment.unbind();
            that.go2doPComment.click(function () {
                that.goDoPComment(product_detail.goods.goodsid);
            });
            that.comment_currentPage_p = 1;
            that.p_comments_load_more.click(function () {
                that.getProductComments(product_detail.goods.goodsid);
            });
            that.product_title.append(product_detail.goods.goodsname);
            var product_img = $("<img/>");
            product_img.attr("src", constants.hostURL + product_detail.goods.pictureurl);
            that.product_image.append(product_img);
            var scores = product_detail.goods.totalGrade / product_detail.goods.sourceCount;//算平均分
            if (!scores >>> 0) {
                scores = 0;
            }
            that.rating_score.raty({readOnly: true, number: 5, score: scores});//TODO
            that.showUserStatus(product_detail);
            that.generateProductIntro(product_detail);
            that.product_content.append(product_detail.detail);
            that.generateArticles(product_detail);
            that.getProductComments(product_detail.goods.goodsid);
        }
        ,


        showUserStatus: function (product_detail) {
            var that = this;
            var useStatus = product_detail.useStatus > 0 ? product_detail.useStatus - 1 : 0;
            var useStatusCnt = product_detail.useStatusCnt;
            var wanna = $("#wanna");
            var used = $("#used");
            var using = $("#using");
            var status_set = $("#user_status").children();
            status_set.find("a").removeClass("ui-btn-active");
            status_set.eq(useStatus).find("a").addClass("ui-btn-active");
            wanna.text("想用(" + useStatusCnt[1] + ")").click(function () {
                that.updateUseStatus(product_detail.goods.goodsid, 1);
            });
            used.text("曾用(" + useStatusCnt[2] + ")").click(function () {
                that.updateUseStatus(product_detail.goods.goodsid, 2);
            });
            using.text("正在用(" + useStatusCnt[3] + ")").click(function () {
                that.updateUseStatus(product_detail.goods.goodsid, 3);
            });
        }
        ,

        updateUseStatus: function (goodsid, idx) {
            console.log(idx);
            $.ajax({
                type: "POST",
                url: constants.hostURL + "app/goods/updateUseStatus.action",
                data: {
                    "goodsid": goodsid,
                    "useStatus": idx,
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                    "deviceId": _UUID
                },
                dataType: "json",
                success: function (new_status) {
                    var useStatusCnt = new_status.response;
                    $.mobile.loading('hide');
                    if (new_status.code === 0) {
                        $("#wanna").text("想用(" + useStatusCnt[1] + ")");
                        $("#used").text("曾用(" + useStatusCnt[2] + ")");
                        $("#using").text("正在用(" + useStatusCnt[3] + ")");
                    } else {
                        alert(new_status.msg);
                    }
                }
            });
        }
        ,

        /**
         * @param product_detail
         */
        parameters_list: $("#parameters_list"),
        generateProductIntro: function (product_detail) {
            var that = this;
            var goodsParameterValue = eval("(" + product_detail.goods.goodsParameterValue + ")");
            var parametersList = eval("(" + product_detail.goodsType.goodsParameter + ")");
            var p_map_temp = new Map();
            $.each(parametersList, function (j) {
                p_map_temp.put(parametersList[j].id, parametersList[j].name);
            });
            console.log(parametersList);
            that.parameters_list.empty();
            $.each(goodsParameterValue, function (i) {
                var param_id = goodsParameterValue[i].id;
                var param_name = p_map_temp.get(param_id);
                var parameter_li = $("<li>" + param_name + ":" + goodsParameterValue[i].value + "</li>")
                that.parameters_list.append(parameter_li);
            });
            try {
                that.parameters_list.listview("refresh");
            } catch (e) {
                console.log(e);
            }
        }
        ,

        /**
         *取得制定产品相关的文章列表
         */
        article_list: $("#article_list"),
        generateArticles: function (product_detail) {
            var that = this;
            var articles = product_detail.articles;
            if (!$.isEmptyObject(articles)) {
                that.article_list.show();
                var divider = $("<li data-role='list-divider' id='article_divider'>相关文章  [更多>]</li>");
                that.article_list.empty();
                that.article_list.append(divider);
                $.mobile.pageContainer.on("pagecontainerchange", function (event, ui) {
                    if (ui.toPage[0].id == "news-content") {
                        new newsContent().goToNewsContent(ui.options.articleid);
                        console.log("after pagecontainerchange", ui.options.articleid);
                    }
                    console.log("I'm kidding at go to news content");
                });
                $.each(articles, function (i) {
                    var li = $("<li><a href='#'>" + articles[i].title + "</a></li>");
                    li.tap(function () {
                        console.log("before change");
                        $.mobile.pageContainer.pagecontainer("change", "newsContent.html#news-content", {
                            type: "get",
                            articleid: articles[i].articleid
                        });
                        console.log("after change");
                    });
                    that.article_list.append(li);
                });
                try {
                    that.article_list.listview("refresh");
                } catch (ex) {
                    that.article_list.listview();
                }
            } else {
                that.article_list.hide();
            }
        }
        ,

        comment_currentPage_p: 1,
        comment_lineSize_p: 10,
        getProductComments: function (goodId) {//获取商品评论
            var that = this;
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/comment/findCommentsByGood.action",
                data: {
                    "goodId": goodId,
                    "currentPage": that.comment_currentPage_p,
                    "lineSize": that.comment_lineSize_p
                },
                dataType: "json",
                success: function (data) {
                    console.log(data.response.page);
                    that.renderProductComment(data.response);
                }
            });
        }
        ,

        p_comment_list: $("#p_comment_list"),
        p_comments_load_more: $("#p_comments_load_more"),
        pCommentCount: $("#pCommentCount"),
        renderProductComment: function (data) {
            var that = this;
            if (that.comment_currentPage_p == 1) {
                that.p_comments_load_more.show();
                that.p_comment_list.find(".list_item").remove();//清空旧的评论
            }
            var heads = data.head;
            var commentRst = data.page.result;
            var hasNextPage = data.page.hasNextPage;
            that.pCommentCount.text("( " + data.page.totalItems + " )");
            if (!$.isEmptyObject(commentRst) && commentRst.length > 0) {
                $.each(commentRst, function (i) {
                    var comment_li = $("<li class='list_item'></li>");
                    var image = $("<img/>");
                    var src = heads[commentRst[i].replyorcommentuserid];
                    image.attr("src", constants.hostURL + src);
                    var button = $("<button class='ui-btn'>回复</button>");
                    button.tap(function () {
                        that.goReplyPComment(commentRst[i], true);
                        console.log(commentRst[i]);
                    });
                    var likeBtn = $("<button class='ui-btn'>赞（" + commentRst[i].likeCount + "）</button>");
                    likeBtn.tap(function () {
                        that.likeGoodComment(commentRst[i].commentid, this);
                        console.log("likeBtn", commentRst[i]);
                    });
                    var replier_name;
                    try {
                        replier_name = $("<h2>" + decodeURIComponent(commentRst[i].replyorcommentusername) + "</h2>");
                    } catch (ex) {
                        console.log("非Encode编码无法解析，直接输出:", commentRst[i].replyorcommentusername)
                        replier_name = $("<h2>" + commentRst[i].replyorcommentusername + "</h2>");
                    }
                    var attr = $("<p class='floor'>" + (i + 1 + (that.comment_currentPage_p - 1) * that.comment_lineSize_p) + "楼 " + commentRst[i].posttime + "</p>")
                    var comment_content;
                    try {
                        comment_content = $("<p>" + decodeURIComponent(commentRst[i].commentcontent) + "</p>");
                    } catch (ex) {
                        console.log("非Encode编码无法解析，直接输出:", commentRst[i].commentcontent)
                        comment_content = $("<p>" + commentRst[i].commentcontent + "</p>");
                    }
                    var nextNodes = commentRst[i].nextNodes;
                    var r_ul = $("<ul data-role='listview' data-inset='false' style='margin-top: 0px;'></ul>");
                    if (!$.isEmptyObject(nextNodes) && nextNodes.length > 0) {//开始评论的回复
                        $.each(nextNodes, function (j) {
                            if (j < 5) {//只取前五条
                                var r_li = $("<li class='list_item'></li>");
                                var r_image = $("<img/>");
                                var r_src = heads[nextNodes[j].replyorcommentuserid];
                                r_image.attr("src", constants.hostURL + r_src);
                                var r_replier_name;
                                try {
                                    r_replier_name = $("<h2>" + decodeURIComponent(nextNodes[j].replyorcommentusername) + "</h2>");
                                } catch (ex) {
                                    console.log("非Encode编码无法解析，直接输出:", nextNodes[j].replyorcommentusername)
                                    r_replier_name = $("<h2>" + nextNodes[j].replyorcommentusername + "</h2>");
                                }
                                var r_attr = $("<p class='floor'>" + nextNodes[j].posttime + "</p>")
                                var r_comment_content;
                                try {
                                    r_comment_content = $("<p>" + decodeURIComponent(nextNodes[j].commentcontent) + "</p>");
                                } catch (ex) {
                                    console.log("非Encode编码无法解析，直接输出:", nextNodes[j].commentcontent)
                                    r_comment_content = $("<p>" + nextNodes[j].commentcontent + "</p>");
                                }
                                r_li.append(r_image, r_replier_name, r_attr, r_comment_content);
                                r_ul.append(r_li);
                                try {
                                    r_ul.listview("refresh");
                                } catch (e) {
                                    r_ul.listview();
                                }
                            } else {
                                return false;
                            }
                        });
                    }
                    comment_li.append(image, button, likeBtn, replier_name, attr, comment_content, r_ul);
                    that.p_comments_load_more.before(comment_li);
                });
                if (commentRst.length == that.comment_lineSize_p) {
                    that.comment_currentPage_p += 1;
                }
            }
            try {
                that.p_comment_list.listview("refresh");
            } catch (e) {
                that.p_comment_list.listview();
            }
            if (!hasNextPage) {
                that.p_comments_load_more.find("a").text("没有更多评论了");
                that.p_comments_load_more.unbind();
                if (commentRst.length == 0) {
                    that.p_comments_load_more.find("a").text("还没有评论");
                }
            } else {
                that.p_comments_load_more.find("a").text("加载更多");
            }
        }
        ,

        likeGoodComment: function (commentId, btn) {
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/comment/likeGoodComment.action",
                data: {
                    "commentId": commentId,
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                    "deviceId": _UUID
                },
                dataType: "json",
                success: function (data) {
                    console.log(data);
                    if (!(!data.code && data.code == 0)) {
                        alert(data.msg);
                    } else {
                        alert("点赞成功");
                        btn.innerText = ("赞（" + data.response + "）");
                    }
                }
            });
        }
        ,

        goDoPComment: function (goodsId, isReply) {//that.rating_score.raty({readOnly: true, number: 5, score: 3.5});//TODO
            $.mobile.pageContainer.pagecontainer("change", "product_comments.html#do_comments_p", {
                type: "get",
                goodId: goodsId
            });
        }
        ,

        goReplyPComment: function (comments, isReply) {//that.rating_score.raty({readOnly: true, number: 5, score: 3.5});//TODO
            $.mobile.pageContainer.pagecontainer("change", "product_comments.html#do_comments_p", {
                type: "get",
                goodId: comments.goodsid,
                isReply: isReply,
                commentId: comments.commentid
            });
        }
        ,

        score_click: 0,
        isReply: null,
        init_comment_p: function (options) {
            var that = this;
            var user_rating = $("#user_rating");
            var submit_comment_production = $("#submit_comment_production");
            that.isReply = options.isReply;
            submit_comment_production.unbind();
            if (that.isReply == true) {
                user_rating.hide();
                submit_comment_production.tap(function () {
                    that.reply_comment_p(options.goodId, options.commentId);
                });
            } else {
                user_rating.raty({
                    number: 5,
                    score: that.score_click,
                    starOff: 'image/star-off-big.png',
                    starOn: 'image/star-on-big.png',
                    click: function (score, evt) {
                        that.score_click = score;
                    }
                });
                submit_comment_production.tap(function () {
                    that.submit_comment_p(options.goodId);
                });
            }
        }
        ,

        comment_production: null,
        submit_comment_p: function (goodId) {
            var that = this;
            var user = new HiFiUser();
            if (user.isTokenKeyValidate()) {
                that.comment_production = $("#edit_comment_production");
                var isReady = true;
                if ($.isEmptyObject(that.comment_production.val().trim())) {
                    alert("请输入评论内容");
                    isReady = false;
                } else if (isReady && that.score_click == 0) {
                    alert("打个分呗");
                    isReady = false;
                }
                if (isReady) {
                    $.ajax({
                        type: "POST",
                        url: constants.hostURL + "/app/comment/addGoodComment.action",
                        data: {
                            "goodId": goodId,
                            "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                            "deviceId": _UUID,
                            "content": that.comment_production.val().trim(),
                            "grade": that.score_click
                        },
                        dataType: "json",
                        success: function (data) {
                            console.log(data);
                            if (!data.code && data.code == 0) {
                                that.comment_currentPage_p = 1;
                                that.getProductComments(goodId);
                                alert("发表评论成功");
                                window.history.back();
                            } else {
                                alert(data.msg);
                            }
                        }
                    });
                }
            } else {
                new QuickLogin().initQRL();
            }
        }
        ,

        reply_comment_p: function (goodId, commentId) {
            var that = this;
            var user = new HiFiUser();
            if (user.isTokenKeyValidate()) {
                that.comment_production = $("#edit_comment_production");
                var isReady = true;
                if ($.isEmptyObject(that.comment_production.val().trim())) {
                    alert("请输入评论内容");
                    isReady = false;
                }
                if (isReady) {
                    $.ajax({
                        type: "POST",
                        url: constants.hostURL + "/app/comment/addGoodReply.action",
                        data: {
                            "commentId": commentId,
                            "goodId": goodId,
                            "tokenKey": localStorage.getItem(constants._TOKEN_KEY),
                            "deviceId": _UUID,
                            "content": that.comment_production.val().trim()
                        },
                        dataType: "json",
                        success: function (data) {
                            console.log(data);
                            if (!data.code && data.code == 0) {
                                that.comment_currentPage_p = 1;
                                that.getProductComments(goodId);
                                alert("回复成功");
                                window.history.back();
                            } else {
                                alert(data.msg);
                            }
                        }
                    });
                }
            } else {
                new QuickLogin().initQRL();
            }
        }
    }
}

/**
 *
 * @returns {{}}
 * @constructor
 */
function EarTest() {
    return {

        playerA: new CirclePlayer("#jquery_jplayer_1",
            {
                wav: ""
            }, {
                supplied: "mp3,wav",
                cssSelectorAncestor: "#cp_container_1"
            }),
        playerB: new CirclePlayer("#jquery_jplayer_2",
            {
                wav: ""
            }, {
                supplied: "mp3,wav",
                cssSelectorAncestor: "#cp_container_2"
            }),
        buttonA: $("#leftBtn"),
        buttonB: $("#rightBtn"),
        buttonNext: $("#nextStep"),
        buttonReTest: $("#reTest"),
        steps: [],//测试步骤
        currentStep: 0,
        lossLess: {wav: "audio/BlueDucks_FourFlossFiveSix.wav"},
        bingo: null,
        userSelected: null,

        init: function () {
            var that = this;
            that.prepareSteps();
            that.currentStep = 0;
            if (Math.random() > Math.random()) {
                that.bingo = "L";
                that.playerA.setMedia(that.lossLess);
                that.playerB.setMedia(that.steps[that.currentStep].media);
            } else {
                that.bingo = "R";
                that.playerA.setMedia(that.steps[that.currentStep].media);
                that.playerB.setMedia(that.lossLess);
            }
            that.buttonA.tap(function () {
                that.setCurrentStepRst("L");
            });
            that.buttonB.tap(function () {
                that.setCurrentStepRst("R");
            });
            that.buttonNext.tap(function () {
                that.prepareNext();
            })
            that.buttonReTest.tap(function () {
                that.resetTest();
            });
        },

        setCurrentStepRst: function (rst) {
            var that = this;
            that.userSelected = rst;
        },

        prepareNext: function () {
            var that = this;
            if (null != that.userSelected) {//是否已经选择答案
                if (that.userSelected == that.bingo) {//如果选对了，进入下一步
                    //alert("恭喜您答对了");
                    if (that.currentStep == (that.steps.length - 1)) {//最后一步
                        that.showScore();//显示最后一步得分
                    }
                    if (that.currentStep < (that.steps.length - 1)) {//是否到达最后一步
                        that.currentStep += 1;//前进一步
                        if (Math.random() > Math.random()) {//随机摆放正确答案
                            that.bingo = "L";
                            that.playerA.setMedia(that.lossLess);
                            that.playerB.setMedia(that.steps[that.currentStep].media);
                        } else {
                            that.bingo = "R";
                            that.playerA.setMedia(that.steps[that.currentStep].media);
                            that.playerB.setMedia(that.lossLess);
                        }
                        that.userSelected = null;
                    }
                } else {//如果选错了，直接显示当前步骤的得分
                    that.showScore();
                }
            } else {
                alert("请选择无损音轨");
            }
        },

        prepareSteps: function () {
            var that = this;
            that.steps[0] = new Step("step01", {mp3: "audio/Summertrain.mp3"}, "恭喜您闯到第一关");
            that.steps[1] = new Step("step02", {mp3: "audio/Flipsyde.mp3"}, "恭喜您闯到第二关");
            that.steps[2] = new Step("step03", {mp3: "audio/apple.mp3"}, "恭喜您闯到第三关");
        },

        showScore: function () {
            var that = this;
            that.playerA.setMedia(null);
            that.playerB.setMedia(null);
            window.location.href = "#testRst";
            $("#rst").empty();
            $("#rst").append(that.steps[that.currentStep].score);
        },

        resetTest: function () {
            window.location.href = "#earTest";
            var that = this;
            that.currentStep = 0;
            if (Math.random() > Math.random()) {
                that.bingo = "L";
                that.playerA.setMedia(that.lossLess);
                that.playerB.setMedia(that.steps[that.currentStep].media);
            } else {
                that.bingo = "R";
                that.playerA.setMedia(that.steps[that.currentStep].media);
                that.playerB.setMedia(that.lossLess);
            }

        }


    }
}

/**
 *
 * @param stepName
 * @param media
 * @param score
 * @constructor
 */
function Step(stepName, media, score) {
    this.stepName = stepName;
    this.media = media;
    this.score = score;
}


/**
 * 用户操作
 */

function HiFiUser() {
    return {

        local_login_btn: $("#login_btn"),
        local_register_btn: $("#register_btn"),
        attendance: $("#doAttendance"),
        doLogoutBtn: $("#doLogout"),

        init: function () {
            var that = this;
            $.base64.utf8encode = true;
            var myCity = new BMap.LocalCity();
            myCity.get(function (result) {
                baidu_cityName = result.name;
                console.log("当前定位城市:" + baidu_cityName);
            });
            that.local_login_btn.tap(function () {
                that.local_login();
            });
            that.local_register_btn.tap(function () {
                that.local_register();
            });
            that.attendance.tap(function () {
                that.makeAttendance();
            });
            that.doLogoutBtn.tap(that.doLogout);
            if (that.isTokenKeyValidate()) {
                that.goToUserInfo();
            } else {//if token invalid, try to do auto login
                if (!$.isEmptyObject(localStorage.getItem(constants._USERNAME)) && !$.isEmptyObject(localStorage.getItem(constants._PASSWORD))) {
                    that.isAutoLogin = true;
                    that.local_login();
                    //that.popLogin();
                } else {
                    window.location.href = "mine.html#mine-login";
                }
            }
        },

        isTokenKeyValidate: function () {
            var token_key = localStorage.getItem(constants._TOKEN_KEY);
            var last_login_million_sec = localStorage.getItem(constants._LAST_LOGIN_MILLION_SECONDS);
            var current_million_sec = (new Date()).valueOf();
            if ($.isEmptyObject(token_key) || (current_million_sec - last_login_million_sec) > 24 * 60 * 60 * 1000) {
                return false;
            } else {
                return true;
            }
        },

        isNewUser: function () {
            var token_key = localStorage.getItem(constants._TOKEN_KEY);
            if ($.isEmptyObject(token_key)) {
                return true;
            } else {
                return false;
            }
        },

        popLogin: function () {
            var that = this;
            var loginForm = $('<div data-role="popup" id="popupLogin" data-theme="a" class="ui-corner-all"></div>');
            loginForm.append('<div style="padding:10px 20px;"><h3>Please sign in</h3><label for="un" class="ui-hidden-accessible">Username:</label><input type="text" name="user" id="un" value="" placeholder="username" data-theme="a"><label for="pw" class="ui-hidden-accessible">Password:</label><input type="password" name="pass" id="pw" value="" placeholder="password" data-theme="a"><button type="submit" class="ui-btn ui-corner-all ui-shadow ui-btn-b ui-btn-icon-left ui-icon-check">Sign in</button></div>')
            loginForm.popup();
            loginForm.popup('open');
        },


        username: $("#username_login"),
        password: $("#password_login"),
        isAutoLogin: false,
        /**
         * HIFI本地用户登录
         */
        local_login: function (user) {//login4App.action
            var that = this;
            var username2login = that.username.val();
            var password2login = that.password.val();
            if (that.isAutoLogin) {
                username2login = $.base64.decode(localStorage._getItem(constants._USERNAME));
                //that.username.val($.isEmptyObject(username2login) ? that.username.val() : username2login);
                password2login = $.base64.decode(localStorage._getItem(constants._PASSWORD));
                //that.password.val($.isEmptyObject(password2login) ? that.username.val() : password2login);
            } else if (!that.validate_loginForm()) {
                return;
            }
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/login4App.action",
                data: {
                    "loginname": username2login,
                    "loginpwd": password2login,
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY)
                },
                dataType: "json",
                //jsonp: "callback",
                success: function (data) {
                    if (!$.isEmptyObject(data.response)) {
                        //that.isAutoLogin = false;
                        //alert("Login/register success,token:"+data.response);
                        that.writeLoginInfo2LocalStorage(data);
                        that.goToUserInfo(data);
                    } else {
                        alert(data.msg);
                    }
                    console.log(data);
                }
            });
        },

        validate_loginForm: function () {
            var that = this;
            var isReady = true;
            if ($.isEmptyObject(that.username.val())) {
                isReady = false;
                that.username.focus();
                alert("Please enter your account");
            } else if (isReady && $.isEmptyObject(that.password.val())) {
                isReady = false;
                alert("Please enter your password");
                that.password.focus();
            }
            return isReady;
        },

        /**
         * 注册本地账号
         */
        email_reg: $("#email_reg"),
        password_reg: $("#password_reg"),
        password_reg_rpt: $("#password_reg_rpt"),
        local_register: function () {
            var that = this;
            if (that.validate_register()) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "/app/register4App.action",
                    data: {"loginname": that.email_reg.val(), "loginpwd": that.password_reg.val()},
                    dataType: "json",
                    //jsonp: "callback",
                    success: function (data) {
                        if (!$.isEmptyObject(data.response)) {
                            //alert("Login/register success,token:"+data.response);
                            that.writeLoginInfo2LocalStorage(data);
                            that.goToUserInfo(data);
                        } else {
                            alert(data.msg);
                        }
                        console.log(data);
                    }
                });
            }
        },

        validate_register: function () {
            var that = this;
            var isReady = true;
            if ($.isEmptyObject(that.email_reg.val())) {
                isReady = false;
                that.email_reg.focus();
                alert("please fill the mail you wanna register");
            } else if (isReady && $.isEmptyObject(that.password_reg.val())) {
                isReady = false;
                alert("please fill password");
                that.password_reg.focus();
            } else if (isReady && $.isEmptyObject(that.password_reg_rpt.val())) {
                isReady = false;
                alert("please confirm the password");
                that.password_reg_rpt.focus();
            }
            return isReady;
        },


        writeLoginInfo2LocalStorage: function (login_info) {
            var that = this;
            var login_time = new Date();
            var username_2b_in_localStorage;
            var password_2b_in_localStorage;
            if (that.isAutoLogin) {
                that.isAutoLogin = false;
            } else {
                username_2b_in_localStorage = $.isEmptyObject(that.username.val()) ? that.email_reg.val() : that.username.val();
                password_2b_in_localStorage = $.isEmptyObject(that.password.val()) ? that.password_reg.val() : that.password.val();
                localStorage.setItem(constants._USERNAME, $.base64.encode(username_2b_in_localStorage));
                localStorage.setItem(constants._PASSWORD, $.base64.encode(password_2b_in_localStorage));
            }
            localStorage.setItem(constants._TOKEN_KEY, login_info.response);
            localStorage.setItem(constants._LAST_LOGIN_TIME, login_time.toLocaleString());
            localStorage.setItem(constants._LAST_LOGIN_MILLION_SECONDS, login_time.valueOf());
        },

        /**
         *
         */
        go2update_btn: $("#go2update_btn"),
        userData: null,
        delta_userData: {},
        info_user: {
            avatar_img: $("#info_avatar"),
            info_nickname: $("#info_nickname"),
            info_sex_city: $("#info_sex_city"),
            info_constellation: $("#info_constellation"),
            info_blood: $("#info_blood"),
            info_phone: $("#info_phone"),
            info_qq: $("#info_qq"),
            info_sina: $("#info_sina"),
            info_mail: $("#info_mail"),
            integration: $("#integration")
        },
        alter_user: {
            nick: $("#alter_nick"),
            sex: $("#alter_gender"),
            city: $("#alter_city"),
            constellation: $("#alter_constellation"),
            blood: $("#alter_blood"),
            mobile: $("#alter_phone"),
            qq: $("#alter_qq"),
            sinaweibo: $("#alter_sina"),
            email: $("#alter_mail")

        },
        goToUserInfo: function () {//member/findInfo.action
            var that = this;
            window.location.href = "mine.html#mine-info";
            that.go2update_btn.unbind();
            that.info_user.avatar_img.unbind();
            console.log("Login/register success,token:" + localStorage.getItem(constants._TOKEN_KEY));
            $.ajax({
                type: "POST",
                url: constants.hostURL + "/app/member/findInfo.action",
                data: {
                    "tokenKey": localStorage.getItem(constants._TOKEN_KEY)
                },
                dataType: "jsonp",
                jsonp: "callback",
                success: function (data) {
                    if (0 == data.code) {
                        that.userData = data.response;
                        that.info_user.avatar_img.attr("src", constants.hostURL + that.userData.headpath);
                        that.info_user.info_nickname.text(decodeURIComponent(that.userData.nick));
                        var sexValue = that.userData.sex == "1" ? "男" : that.userData.sex == "0" ? "女" : "未知";
                        that.info_user.info_sex_city.text(sexValue + "  " + decodeURIComponent(that.userData.city));
                        that.info_user.info_constellation.text(decodeURIComponent(that.userData.constellation));
                        that.info_user.info_blood.text(decodeURIComponent(that.userData.blood));
                        that.info_user.info_phone.text(that.userData.mobile);
                        that.info_user.info_qq.text(that.userData.qq);
                        that.info_user.info_sina.text(that.userData.sinaweibo);
                        that.info_user.info_mail.text(that.userData.email);
                        that.info_user.integration.text("当前积分：" + that.userData.integration);
                    } else {
                        alert(data.msg);
                    }
                    console.log(data);
                    that.go2update_btn.click(function () {
                        that.prepareUpdate();
                    });
                    that.info_user.avatar_img.click(function () {
                        that.prepareAvatarUpdate();
                    });
                }
            });
        },

        new_avatar_sel: $("#new_avatar_sel"),//the image select button
        new_avatar_pre: $("#new_avatar_pre"),//going to do the image crop preview
        avatar_update_btn: $("#avatar_update_btn"),//button trigger the cropped image upload
        recap_preview: $("#recap_preview"),//the canvas to do the real image crop
        recap_preview_img: $("#recap_preview_img"),//the canvas to do the real image crop
        urlData: null,
        prepareAvatarUpdate: function () {
            var that = this;
            window.location.href = "mine.html#avatar-update";
            that.new_avatar_pre.attr("src", constants.hostURL + that.userData.headpath);//先预览之前的头像
            that.new_avatar_sel.unbind();
            that.new_avatar_sel.change(function () {//绑定新头像的选择事件
                var selected = this.files[0];
                var reader = new FileReader();
                //var canvas = document.getElementById('myCanvas');

                reader.onload = function () {
                    var fileType = selected.type;
                    if (fileType.indexOf("image") > -1) {
                        // 通过 reader.result 来访问生成的 DataURL
                        that.urlData = reader.result;
                        //that.new_avatar_pre.src=url;
                        that.new_avatar_pre.attr("src", that.urlData);
                        //that.new_avatar_pre.style.width = document.documentElement.clientWidth * 0.9;
                        //that.new_avatar_pre.style.height = 'auto';
                        that.initCrop();
                    } else {
                        alert("请选择图片文件");
                    }
                };
                reader.readAsDataURL(this.files[0]);
            });
            that.avatar_update_btn.unbind();
            that.avatar_update_btn.click(function () {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "app/member/headImgUploads.action",
                    data: {
                        "imgBase64": $("#recap_preview")[0].toDataURL("image/png").split(',')[1],
                        "tokenKey": localStorage.getItem(constants._TOKEN_KEY)
                    },
                    dataType: "json",
                    contentType: "application/x-www-form-urlencoded; charset=utf-8",
                    //jsonp: "callback",
                    success: function (data) {
                        if (data.code == 0) {
                            console.log("updated user avatar", data);
                            window.location.reload();
                        } else if (data.code == 1) {
                            alert(data.msg);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        alert("You can not send Cross Domain AJAX requests: " + errorThrown);
                    }
                });
            });
        },


        jcrop_api: null,
        initCrop: function () {
            var that = this;
            try {
                that.jcrop_api.destroy();
            } catch (ex) {
                console.log(ex);
            }
            var boundx,
                boundy;
            //
            //// Grab some information about the preview pane
            ////    $preview = that.recap_preview,
            //    //$pcnt = $('#preview-pane .preview-container'),
            //    $pimg = $('#preview-pane .preview-container img'),
            //
            //    xsize = that.recap_preview_img.width(),
            //    ysize = that.recap_preview_img.height();
            that.new_avatar_pre.Jcrop({
                onChange: that.drawPreview,
                onSelect: that.drawPreview,
                setSelect: [0, 0, 100, 100],
                aspectRatio: 1
            }, function () {
                // Use the API to get the real image size
                var bounds = this.getBounds();
                console.log(bounds);
                boundx = bounds[0];
                boundy = bounds[1];
                // Store the API in the jcrop_api variable
                that.jcrop_api = this;

                // Move the preview into the jcrop container for css positioning
                //that.recap_preview_img.appendTo(jcrop_api.ui.holder);
            });
        },

        canvasContext: null,
        drawPreview: function (c) {
            var that = this;
            var imageSource = $("#new_avatar_pre")[0];
            var naturalWidth = imageSource.naturalWidth;
            var boundWidth = imageSource.style.width.replace("px", "");
            var ratio = naturalWidth / boundWidth;
            //ratio = ratio > 1 ? ratio : 1;
            console.log(naturalWidth, boundWidth, ratio);
            var sourceX = Math.ceil(c.x * ratio);
            var sourceY = Math.ceil(c.y * ratio);
            var sourceWidth = Math.ceil(c.w * ratio);
            var sourceHeight = Math.ceil(c.h * ratio);
            console.log(sourceWidth, sourceHeight);
            var destWidth = 100;
            var destHeight = 100;
            var destX = 0;
            var destY = 0;

            if ($.isEmptyObject(that.canvasContext)) {
                that.canvasContext = $("#recap_preview")[0].getContext('2d');
            }
            that.canvasContext.drawImage(imageSource, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
            console.log($("#recap_preview")[0].toDataURL());
            $("#recap_preview_img")[0].src = $("#recap_preview")[0].toDataURL("image/png");
        },

        update_btn: $("#update_btn"),
        prepareUpdate: function () {
            var that = this;
            that.update_btn.unbind();
            that.update_btn.click(function () {
                that.updateUserInfo();
            });
            $.each(that.alter_user, function (item) {
                try {
                    console.log("真的解码了");
                    $(this).val(decodeURIComponent(that.userData[item]));
                } catch (ex) {
                    console.log("原样输出了");
                    $(this).val(that.userData[item]);
                }
                this.change(function () {
                    that.delta_userData[item] = $(this).val();
                    console.log(that.delta_userData);
                });
            });
            if ($.isEmptyObject(that.userData.city)) {
                that.alter_user.city.val(baidu_cityName).change();
            }
        },

        /**
         *
         */
        updateUserInfo: function () {
            var that = this;
            if (confirm("Ready to go?")) {
                $.extend(that.userData, that.delta_userData);
                $.each(that.userData, function (item) {
                    try {
                        that.userData[item] = encodeURIComponent(that.userData[item]);
                    } catch (ex) {
                        console.log("擦了");
                    }
                });

                console.log(that.userData);
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "app/member/updateInfo.action",
                    data: $.extend(that.userData, {"tokenKey": localStorage.getItem(constants._TOKEN_KEY)}),
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function (data) {
                        if (data.code == 0) {
                            console.log("updated user info", data);
                            window.location.reload();
                        } else if (data.code == 1) {
                            alert(data.msg);
                        }
                    }
                });
            }
        },

        /**
         * 每日签到
         */
        makeAttendance: function () {
            var that = this;
            $.ajax({
                type: "POST",
                url: constants.hostURL + "app/member/signEachDay.action",
                data: {"tokenKey": localStorage.getItem(constants._TOKEN_KEY)},
                dataType: "jsonp",
                jsonp: "callback",
                success: function (data) {
                    if (data.code == 0) {
                        that.info_user.integration.text("当前积分：" + data.response.integration);
                        if (data.response.status == 0) {
                            alert("签到成功");
                        }
                    } else if (data.code == 1) {
                        alert(data.msg);
                    }
                }
            });
        },

        /**
         * 注销当前登录用户
         */
        doLogout: function () {
            localStorage.clear()
            window.location.href = "mine.html";

        },

        isEmail: function () {

        },

        isMobilePhone: function () {

        }
    }
}

/**
 *
 * @constructor
 */
function QuickLogin() {

    return {

        username: $("#username_qLogin"),
        password: $("#password_qLogin"),
        qLoginBtn: $("#qlg_btn"),
        qGoRegisterBtn: $("#qGoRegisterBtn"),

        tryLogin: function () {
            var that = this;
            var isReady = true;
            if ($.isEmptyObject(that.username.val().trim())) {
                isReady = false;
                that.username.val("").focus();
                alert("Please enter your account");
            } else if (isReady && $.isEmptyObject(that.password.val().trim())) {
                isReady = false;
                alert("Please enter your password");
                that.password.val("").focus();
            }
            if (isReady) {
                $.ajax({
                    type: "POST",
                    url: constants.hostURL + "/app/login4App.action",
                    data: {
                        "loginname": that.username.val().trim(),
                        "loginpwd": that.password.val().trim(),
                        "tokenKey": localStorage._getItem(constants._TOKEN_KEY)
                    },
                    dataType: "json",
                    success: function (data) {
                        if (!$.isEmptyObject(data.response)) {
                            var login_time = new Date();
                            localStorage.setItem(constants._USERNAME, $.base64.encode(that.username.val().trim()));
                            localStorage.setItem(constants._PASSWORD, $.base64.encode(that.password.val().trim()));
                            localStorage.setItem(constants._TOKEN_KEY, data.response);
                            localStorage.setItem(constants._LAST_LOGIN_TIME, login_time.toLocaleString());
                            localStorage.setItem(constants._LAST_LOGIN_MILLION_SECONDS, login_time.valueOf());
                            if (!alert("登录成功")) {
                                window.history.back();
                            }
                        } else {
                            alert(data.msg);
                        }
                        console.log(data);
                    }
                });
            }
        },

        initQRL: function () {
            $.mobile.pageContainer.pagecontainer("change", "qrl.html", {
                type: "get"
            });
        },

        initPage: function () {
            var that = this;
            var usernameInLocal = $.base64.decode(localStorage._getItem(constants._USERNAME));
            var passwordInLocal = $.base64.decode(localStorage._getItem(constants._PASSWORD));
            that.username.val(usernameInLocal);
            that.password.val(passwordInLocal);
            that.qLoginBtn.click(function () {
                that.tryLogin();
            });
        }
    }

}

