// ==UserScript==
// @name        Bored
// @namespace   http://userscripts.org/O_Lawd
// @include     http://derpiboo.ru/*
// @include     http://www.derpiboo.ru/*
// @include     http://derpibooru.org/*
// @include     http://www.derpibooru.org/*
// @version     0.2.3
// @updateURL   http://userscripts.org/scripts/source/137452.meta.js
// @description Booru On Rails Extension Demo: Various (Likely Temp) Tweaks for Derpiboo.ru
// ==/UserScript==

function BOREDInit() {
    'use strict';

    // Options.
    // TODO: I think code will end up cleaner if I make this a function and tie
    // it directly to respective feature functions.
    var BOREDConfig = {
        MOVE_WATCHED_LINK: true,
        AUTO_EXPAND_COMMENT_IMAGES: true,
        HIDE_COMMENT_IMAGES: false,
        SHOW_REVERSE_SEARCH_LINKS: true,
        SHOW_ZOOM_CURSOR: true,
        ENABLE_MARKITUP: true,
        SHOW_COMMENT_LINKS: true,
        ENABLE_FILE_UPLOAD_PREVIEW: true,
        NOSTALGIA_MODE: false,
        
        PANEL: {
            'Layout': {
                MOVE_WATCHED_LINK: 'Move "Watched" Link to Top-Right Corner',
                NOSTALGIA_MODE: 'Nostalgia Mode (Not Serious!)',
            },
            'Images': {
                AUTO_EXPAND_COMMENT_IMAGES: 'Click to Expand Comment Images', 
                ENABLE_FILE_UPLOAD_PREVIEW: 'Preview Manual File Uploads',
                SHOW_ZOOM_CURSOR: 'Show Zoom Cursors',
                SHOW_REVERSE_SEARCH_LINKS: 'Reverse Image Search Links'
            },
            'Comment Editing': {
                SHOW_COMMENT_LINKS: 'Reply Links in Comments',
                ENABLE_MARKITUP: 'Enable markItUp! WYSIWYM Editing'
            }
        }
    },
    menusEnabled = false,
    $imageInput;

    BOREDConfig.setOpt = function (optName, val) {
        BOREDConfig[optName] = val;
        BOREDConfig.saveSettings();
    };

    BOREDConfig.makePanel = function () {
        var $settingsLink = $('<a href="#">Ext</a>'),
            $panelDiv = $('<form class="boredpanel"></form>'),
            $submit = $('<input type="submit" value="Save and Reload" />'),
            $cancel = $('<input type="reset" value="Cancel" />'),
            widgets = [];
            
        if ($('a[href="/users/sign_in"]').length) {
            $settingsLink.insertBefore('.userbox > a[href="/users/sign_in"]');
        } else {
            $settingsLink.insertBefore('.userbox > a[href="/users/sign_out"]');
        }
        
        // Create the HTML and option widgets.
        $panelDiv.append('<h2>B.O.R.E.D. Settings</h2>');
        $.each(BOREDConfig.PANEL, function (header, options) {
            $panelDiv.append('<h3>' + header + '</h3>');

            // Every option at the moment is a plain Boolean. In the future,
            // I'll make text and integer widgets with tests done with the
            // instanceof operator.
            $.each(options, function (name, description) {
                var widget = new BOREDConfig.BooleanWidget(name, description,
                                                           BOREDConfig[name]);
                $panelDiv.append(widget.element);
                widgets.push(widget);
            });
        });
        $panelDiv.append($submit).append($cancel);
        
        // Panel CSS.
        $panelDiv.css({
            display: 'none',
            position: 'absolute',
            right: '4px',
            top: '40px',
            width: '400px',
            zIndex: '9001',
            overflow: 'hidden',
        });
        $panelDiv.addClass('image_description');
        $('.field', $panelDiv).css({
            marginTop: '0.5em',
            marginBottom: '0.5em',
        });
        $('.field label', $panelDiv).css('width', '300px');
        $('h2,h3', $panelDiv).css('text-align', 'center');
        $('h2', $panelDiv).css({
            fontWeight: 'bold',
            marginBottom: '0.5em'
        });
        $('h3', $panelDiv).css({
            marginTop: '1em',
            marginBottom: '0.5em'
        });
        $submit.css({
            width: '80%',
            margin: '1em auto 0.5em 10%'
        });
        $cancel.css({
            width: '80%',
            margin: '0 auto 0.3em 10%',
            // It defaults to Courier New, lol
            fontFamily: 'verdana,arial,helvetica,sans-serif'
        });
               
        $panelDiv.insertAfter('#header');
        
        $settingsLink.click(function () {
            $('.boredpanel').stop(true, true).slideToggle('fast');
            return false;
        });
        
        $panelDiv.submit(function () {
            $.each(widgets, function(i, widget) {
                widget.writeSetting();
            });
            BOREDConfig.saveSettings();
        });
        
        $panelDiv.on('reset', function () {
            $settingsLink.click();
        });
    };
    
    BOREDConfig.BooleanWidget = function (name, label, initial) {
        var id = 'BORED-' + name,
            $el = $('<div class="field"><input type="checkbox" id="' + id + 
                    (initial ? '" checked="checked" ' : '" ') + '/>' +
                    '<label for="' + id + '">' + label + '</label></div>');
                        
        this.name = name;
        this.element = $el;
    };
    
    BOREDConfig.BooleanWidget.prototype.getInput = function () {
        return $('input', this.element);
    };
    
    BOREDConfig.BooleanWidget.prototype.writeSetting = function () {
        BOREDConfig[this.name] = this.getInput().is(':checked');
    };
    
    BOREDConfig.loadSettings = function () {
        $.each(BOREDConfig, function(option, val) {
            var cookie;
            if (!(val instanceof Function) && option !== 'PANEL') {
                cookie = $.cookie('BOREDConfig_' + option);
                if (cookie && option !== 'PANEL') {
                    BOREDConfig[option] = JSON.parse(cookie);
                }
            }
        });
    };
    
    BOREDConfig.saveSettings = function () {
        var decade = 10 * 365 * 24 * 3600;

        $.each(BOREDConfig, function(option, val) {
            if (!(val instanceof Function) && option !== 'PANEL') {
                $.cookie('BOREDConfig_' + option, JSON.stringify(val),
                    {path: '/', expires: decade});
            }
        });
    };
          
    // Slide-down menu functionality for the metabar.
    function SlideDownMenu($element, minWidth) {
        var $m = $('<div class="slidedownmenu" ' + 
                   'style="display:inline;vertical-align:top;">' +
                   '<div class="slidedownmenu-inner" ' + 
                   'style="position:absolute;display:none;' +
                   'min-width:' + minWidth + '"></div></div>'),
            $menu = $('div.slidedownmenu-inner', $m);
            
        if (!menusEnabled) {            
            $(document).on('mouseenter', 'div.slidedownmenu', function () {
                $(this).find('.slidedownmenu-inner').stop(true, true)
                       .slideDown('fast');
            }).on('mouseleave', 'div.slidedownmenu', function () {
                $(this).find('.slidedownmenu-inner').stop(true, true)
                       .slideUp('fast');
            });
            menusEnabled = true;
        }

        $element.insertBefore($menu);

        this.body = $menu;
        this.top = $m;
    };
    
    // Utility function for inserting at caret for selected <textarea>s.
    // It's almost 4AM, and I don't feel like messing with DOM (or IE), so
    // this snippet is from
    // http://stackoverflow.com/questions/946534/insert-text-into-textarea-with-jquery
    // Thanks go to Aniebiet Udoh.    
    $.fn.extend({
        insertAtCaret: function(myValue){
            return this.each(function(i) {
                if (document.selection) {
                    //For browsers like Internet Explorer
                    this.focus();
                    sel = document.selection.createRange();
                    sel.text = myValue;
                    this.focus();
                }
                else if (this.selectionStart || this.selectionStart == '0') {
                    //For browsers like Firefox and Webkit based
                    var startPos = this.selectionStart;
                    var endPos = this.selectionEnd;
                    var scrollTop = this.scrollTop;
                    this.value = this.value.substring(0, startPos) + myValue +
                                 this.value.substring(endPos,this.value.length);
                    this.focus();
                    this.selectionStart = startPos + myValue.length;
                    this.selectionEnd = startPos + myValue.length;
                    this.scrollTop = scrollTop;
                } else {
                    this.value += myValue;
                    this.focus();
                }
            });
        }
    });

    // Mouse cursors for zoom-in/zoom-out.
    function zoomIn() {
        if ($.browser.mozilla) {
            return '-moz-zoom-in';
        }
        else if ($.browser.webkit) {
            return '-webkit-zoom-in';
        }
        // I need a URL.
        return 'pointer';
    }
        
    function zoomOut() {
        if ($.browser.mozilla) {
            return '-moz-zoom-out';
        }
        else if ($.browser.webkit) {
            return '-webkit-zoom-out';
        }
        else {
            return 'pointer';
        }
    }

    function ZoomCursors() {        
        $('div#image_target').css('cursor', zoomIn()).click(function () {
            var $this = $(this);
            if ($this.data('expanded')) {
                $this.data('expanded', false);
                $this.css('cursor', zoomIn());
            } else {
                $this.data('expanded', true);
                $this.css('cursor', zoomOut());
            }
        });
    }
    
    // Move the "Watched" link to the user nav bar.
    function moveWatched() {
        $('div#navigation > a[href="/images/watched"]')
            .insertBefore('div.userbox > a[href="/messages"]');
    }
    
    // Related images link. I should probably make this a menu for TinEye, too.
    function relImages() {
        var url = $('div.metabar > div.metasection:nth-last-child(2) > ' +
                    'a:first-child').attr('href'),
            $header = $('<a href="#">Rev. Img. Search \u25BC</a>'),
            menu = new SlideDownMenu($header, '12em');
            
        $('div.metabar > div.metasection:nth-last-child(2)').prepend(menu.top);
            
        menu.body.append(
          '<a style="display:block" href="https://www.google.com/' +
          'searchbyimage?num=10&hl=en&site=imghp&image_url=' + url +
          '" target="_blank">Google</a><a style="display:block" ' +
          'href="http://www.tineye.com/search/?url=' + url +
          '" target="_blank">TinEye</a></div></div>'
        );
    }
      
    function ImageResizer($image, maxWidth, maxHeight) {
        var expander = this;
        
        this.maxWidth = maxWidth || 500;
        this.maxHeight = maxHeight || 500;
        this.image = $image;
        this.domImage = $image[0];
        this.origWidth = this.domImage.naturalWidth || this.domImage.width;
        this.origHeight = this.domImage.naturalHeight || this.domImage.height;
        this.expanded = false;
        
        // CSS workaround.
        $image.css('max-width', this.origWidth);
        
        this.shrinkImageSize();
      
        $image.click(function () {
            if (expander.expanded) {
                expander.shrinkImageSize();
            } else {
                expander.expandImageSize();
            }
        });
    }
    
    ImageResizer.prototype.shrinkImageSize = function () {
        var domImage = this.domImage,
            maxWidth = this.maxWidth,
            maxHeight = this.maxHeight;
            
        if (domImage.width > maxWidth) {
            domImage.height = domImage.height / domImage.width * maxWidth;
            domImage.width = maxWidth;
        }
  
        if (domImage.height > maxHeight) {
            domImage.width = domImage.width / domImage.height * maxHeight;
            domImage.height = maxHeight;
        }
        
        this.image.parent().css('overflow', '');
        if (BOREDConfig.SHOW_ZOOM_CURSOR) {
            this.image.css('cursor', zoomIn());
        }
        this.expanded = false;
    };
    
    ImageResizer.prototype.expandImageSize = function () {
        var $img = this.image,
            domImage = this.domImage,
            origWidth = this.origWidth,
            origHeight = this.origHeight;
        
        $img.attr('width', this.origWidth);
        $img.attr('height', this.origHeight);
        
        if (BOREDConfig.SHOW_ZOOM_CURSOR) {
            $img.css('cursor', zoomOut());
        }
        $img.parent().css('overflow', 'visible');
        this.expanded = true;
    }
    
    // Image Previewing on upload.
    function imagePreview($imageInput) {
        var fr = new FileReader(),
            readFile = function () {
                var fileArr = $imageInput[0].files;
                if ( fileArr && fileArr.length ) {
                    fr.readAsDataURL(fileArr[0]);
                }
            },
            $clearLink = 
                $('<a href="#" style="margin-left:2em">\u2718 Clear</a>'),
            newImage = function (source) {
               var img = new Image(),
                   $img = $(img);

               img.addEventListener('load', function (e) {
                   this.title = 'Original Dimensions: ' + e.target.width +
                                'x' + e.target.height;
                   this.alt = 'Image Preview';

                   new ImageResizer($img);

                   $img.addClass('preview');
                   $img.css({
                       display: 'block',
                       margin: '1em 0 1em 5em'
                   });
                   $clearLink.after($img);
                }, false);
               
                img.src = source;
            };
         
        // The clear link.
        $clearLink.click(function () {
            $imageInput.val('');
            $('img.preview').remove();
            return false;
        });
        $imageInput.after($clearLink);
  
        fr.onload = function (e) {
            $('img.preview').remove();
            newImage(e.target.result);
        };
        
        $imageInput.on('change', readFile);
        readFile();
    }
    
    function commentLinking() {
        function textileAppender($link, textileStr) {
            $link.click(function () {
                // I have to reselect this everytime because the AJAX is weird.
                var $commentBody = $('textarea#comment_body');
                $commentBody[0].focus();
                $commentBody.insertAtCaret(textileStr);
                return false;
            });
        }

        function setupHeader($commentHeader) {
            var name = $.trim($commentHeader.find('strong').text()),
                id = $commentHeader.find('a').last().attr('href')
                                   .split('#')[1],
                $mentionLink = $('<a href="#">#Mention</a>'),
                $replyLink = $('<a href="#">@Reply</a>');

            textileAppender($mentionLink, ' "#' + name + '":' + 
                            window.location.pathname + '#' + id + ' ');
            textileAppender($replyLink, '"@' + name + '":' + 
                            window.location.pathname + '#' + id + '\r\n\r\n');
            
            $commentHeader.append($mentionLink).append(' ').append($replyLink);
        }

        function updateHeaders() {
            var $commentHeaders = $('div.comment_info'),
                $header,
                i;
         
            for (i = 0; i < $commentHeaders.length; i += 1) {
                $header = $($commentHeaders[i]);
                if (!$header.data('commentLinkEnabled')) {
                    setupHeader($header);
                    $header.data('commentLinkEnabled', true);
                }
            }
        }
           
        // Execute on AJAX load, too.
        $('#new_comment').ajaxComplete(updateHeaders);
        $('#comments').ajaxComplete(updateHeaders);
        updateHeaders();
    }
    
    function makeCommentImagesExpandable() {
        function bind($img) {
            if (!$img.data('expansionEnabled')) {
                $img.load(function (e) {
                    new ImageResizer($(this), 600, 1000);
                });
                $img.data('expansionEnabled', true);
            }
        }
    
        function execute() {
            var $commentImages = $('img', 'div[id^="image_comments"]');
            
            $commentImages.each(function () {
                bind($(this));
            });
        }

        $('#new_comment').ajaxComplete(execute);
        $('#comments').ajaxComplete(execute);
        execute();
    }
    
    function CommentImagesToggler() {
        var me = this;        
        this.eventsAttached = false;
        
        function execute() {
            var $ins = $('div.metabar.metabar_redux').first();
            if (!$ins.data('executed')) {
                $ins.append('<form action="#" style="float:right">' + 
                            '<label for="bored-disable-images">No ' +
                            'Images</label><input type="checkbox" ' +
                            'id="bored-disable-images" /></form>');
                $('#bored-disable-images').change(function () {
                    me.toggle($(this).is(':checked'));
                }).prop('checked', BOREDConfig.HIDE_COMMENT_IMAGES);
                
                $ins.data('executed', true);
            }
        }
        
        $('#new_comment').ajaxComplete(execute);
        $('#comments').ajaxComplete(execute);
        execute();
        
        if (BOREDConfig.HIDE_COMMENT_IMAGES) {
            this.toggle(true);
        }
    }
    
    CommentImagesToggler.prototype.hideImages = function () {
        var $commentImages = $('img', 'div[id^="image_comments"]');
        $commentImages.each(function () {
            $(this).css('display', 'none');
        });
    }
    
    CommentImagesToggler.prototype.toggle = function (hide) {       
        if (hide) {
            if (!this.eventsAttached) {
                $('#new_comment').on('ajaxComplete', this.hideImages);
                $('#comments').on('ajaxComplete', this.hideImages);
            }
            this.eventsAttached = true;
            this.hideImages();
        } else {
            $('#new_comment').off('ajaxComplete', this.hideImages);
            $('#comments').off('ajaxComplete', this.hideImages);
            this.eventsAttached = false;
            $('img', 'div[id^="image_comments"]').css('display', '');
        }
        
        BOREDConfig.setOpt('HIDE_COMMENT_IMAGES', hide);
    };

    function SimpleTextileSubsetParser() {
        this.tokenMaps = [
            [/\[\*([^\n]+?)\*\]/g, '<strong>$1</strong>'],
            [/\[_([^\n]+?)_\]/g, '<em>$1</em>'],
            [/\[\+([^\n]+?)\+\]/g, '<ins>$1</ins>'],
            [/\[\-([^\n]+?)\-\]/g, '<del>$1</del>'],
            [/\[\^([^\n]+?)\^\]/g, '<super>$1</super>'],
            [/\[~([^\n]+?)~\]/g, '<sub>$1</sub>'],
            [/\[@([^\n]+?)@\]/g, '<code>$1</code>'],
            [/(^|\W)\*([^\n]+?)\*(\W|$)/g, '$1<strong>$2</strong>$3'],
            [/(^|\W)_([^\n]+?)_(\W|$)/g, '$1<em>$2</em>$3'],
            [/(^|\W)\+([^\n]+?)\+(\W|$)/g, '$1<ins>$2</ins>$3'],
            [/(^|\W)\-([^\n]+?)\-(\W|$)/g, '$1<del>$2</del>$3'],
            [/(^|\W)\^([^\n]+?)\^(\W|$)/g, '$1<super>$2</super>$3'],
            [/(^|\W)~([^\n]+?)~(\W|$)/g, '$1<sub>$2</sub>$3'],
            [/(^|\W)@([^\n]+?)@(\W|$)/g, '$1<code>$2</code>$3'],
            [/&gt;&gt;(\d+)/g, '<a href="/images/$1">&gt&gt$1</a>'],
            [/(^|\W)\!(.+?)(?:\((.*)\))?\!(\W|$)/g,
             '$1<img src="$2" title="$3" alt="$3" />$4'],
            [/&quot;(.+?)(?:\((.*)\))?&quot;:([^\s<>]+)/,
              '<a href="$3" title="$2">$1</a>'],  
        ];
    }
    
    SimpleTextileSubsetParser.prototype.parse = function (str) {
        // Clear out HTML-like entities as the RedCloth implementation does.
        var outStr = str.replace(/&/g, '&amp;').replace(/<\w[^\n]*>/g, '')
                        .replace(/>/g, '&gt;').replace(/</g, '&lt;')
                        .replace(/"/g, '&quot;');
        outStr = '<p>' + outStr + '</p>';

        while (outStr !== str) {
            str = outStr;
            $.each(this.tokenMaps, function (i, v) {
                outStr = outStr.replace(v[0], v[1]);
            });
        }

        return outStr.replace(/\r?\n\r?\n/g, '</p><p>')
                     .replace(/\r?\n/g, '<br />');;
    }
    
    function SimpleTextileSubsetRenderer($markedUpTextarea) {
        this.parser = new SimpleTextileSubsetParser();
        this.previewWindow = $('<div class="textile_preview"></div>');
        this.previewWindow.insertAfter($markedUpTextarea);
    }
    
    SimpleTextileSubsetRenderer.prototype.render = function (str) {
        this.previewWindow.html(
            '<div class="comment_body"><h5>Comment Preview</h5>' +
            this.parser.parse(str) + '</div>'
        );
    };
  
    function doMarkItUp() {
        // TODO: Rewrie this to take advantage of jQuery.
        
        // data:URIs. This won't be pretty, but it will be fairly efficient
        // bandwidth-wise.
        var handleImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAGAgMAAABROz0wAAAAA3NCSVQICAjb4U/gAAAADFBMVEWwuL/////39/eyub9nsXv9AAAABHRSTlP/AP//07BylAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNy8yMS8wN4dieEgAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAMElEQVQImWNwDBF1DGFgaIwQbYxgYFgaFbo0yoEhlDUglNWBIYw1IQxETc0Mm+oAANc3CrOvsJfnAAAAAElFTkSuQmCC',
            codeImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAALtSURBVBgZTcFLaFxVAIDh/5577jwzj0wSUmqMtKIiBltbbJ1FUCxVoQu3FrHGVRU3BVcKrkTcKOhCUOtOAyJ23WIQtFawpoooZWKJpnbsNJN5PzP3PO5xArPo93nOOfasXCgfAz48mE8UhzpiqCN0FLFrog7QA+qABVpAA/gC+FYyERlz/NC+qeIbT85xt4GKckMV5Voju6A09ELLzXqfi38PTgLnJBORMfPZmMeectsSeB7SA19CPBAsxgW+EAQ+PLaQZH8uXTj/S+UDwYTVOitxmAh6yqOjoR1CZwSdETR2Yadv2fPm6i2KB9IszQZzkgkVmvnLZcuP21VeO1rgs+tdAu1YOZxlKiHw8fA9iADPdvn5nxa/3epUBGOH39sqjETu2UJG4oUwDB2RcmRSHuevdtjpWgZhxEBH4KDaDflobbNrlVoRh97demHpgfTth+5J5ZpNw5kjWQxw6mCa7aYlk4bPr7X54XqfkfGIHNjAYpQ6cOH1x9fEw/cnP13M+Ik7bc3ZYxniMR9PQCElObmYptox7E97XK0MscbhHJgwxKrQMiZ+v9Y9u3knHBUCn08ut6m2DQJHe6C5WOqQl4KbVcXR2QSxwENbS38wNEapLmNi4/0Hv/r3zxvHN0p1YnGP1e/r4ODr9TbZlKBTU7xSnKG4lCUZQKMfYkJVvfT2c44xyVjKr6lpEUI3g3UOPIE1lu6O5aUTcyRjPjhISUGttYtVYYUJuXxudRZ4p/jIvZx+eoHvSopmz/Ly8jyJwBFIkD7EfMimYLM8xChVZUJapU4Ap34tbdHalfRDh7aOUHsoE2FsROQchVyOV5/Zx3ZjiFWqxoS0Wh95/qlHk2+9+AR3sw60dSgDOPj4UoVUAL3+EKt1gwlptd7arnf4cq1EfipJPpsgn46TS8fJpGLEY4K4FJxenicuodbsYbX+jwkZGfPNlfWNhSvrG/cBM8AMMA1MA7lELAgSiYBsOkk+m+KPv8o3gJ+Y+B9yFXCQeyJWrQAAAABJRU5ErkJggg==',    
            boldImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADCSURBVCjPY/jPgB8yUEtBeUL5+ZL/Be+z61PXJ7yPnB8sgGFCcX3m/6z9IFbE/JD/XucxFOTWp/5PBivwr/f77/gfQ0F6ffz/aKACXwG3+27/LeZjKEioj/wffN+n3vW8y3+z/Vh8EVEf/N8LLGEy3+K/2nl5ATQF/vW+/x3BCrQF1P7r/hcvQFPgVg+0GWq0zH/N/wL1aAps6x3+64M9J12g8p//PZcCigKbBJP1uvvV9sv3S/YL7+ft51SgelzghgBKWvx6E5D1XwAAAABJRU5ErkJggg==',
            italicImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAABxSURBVCjPY/jPgB8yUFtBdkPqh4T/kR+CD+A0Ie5B5P/ABJwmxBiE//f/gMeKkAlB/90W4FHg88Dzv20ATgVeBq7/bT7g8YXjBJf/RgvwKLB4YPFfKwCnAjMH0/8a/3EGlEmD7gG1A/IHJDfQOC4wIQALYP87Y6unEgAAAABJRU5ErkJggg==',
            linkImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADpSURBVCjPY/jPgB8y0EmBHXdWaeu7ef9rHuaY50jU3J33v/VdVqkdN1SBEZtP18T/L/7f/X/wf+O96kM3f9z9f+T/xP8+XUZsYAWGfsUfrr6L2Ob9J/X/pP+V/1P/e/+J2LbiYfEHQz+ICV1N3yen+3PZf977/9z/Q//X/rf/7M81Ob3pu1EXWIFuZvr7aSVBOx1/uf0PBEK3/46/gnZOK0l/r5sJVqCp6Xu99/2qt+v+T/9f+L8CSK77v+pt73vf65qaYAVqzPYGXvdTvmR/z/4ZHhfunP0p+3vKF6/79gZqzPQLSYoUAABKPQ+kpVV/igAAAABJRU5ErkJggg==',
            pictureImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHwSURBVDjLpZM9a1RBFIafM/fevfcmC7uQjWEjUZKAYBHEVEb/gIWFjVVSWEj6gI0/wt8gprPQykIsTP5BQLAIhBVBzRf52Gw22bk7c8YiZslugggZppuZ55z3nfdICIHrrBhg+ePaa1WZPyk0s+6KWwM1khiyhDcvns4uxQAaZOHJo4nRLMtEJPpnxY6Cd10+fNl4DpwBTqymaZrJ8uoBHfZoyTqTYzvkSRMXlP2jnG8bFYbCXWJGePlsEq8iPQmFA2MijEBhtpis7ZCWftC0LZx3xGnK1ESd741hqqUaqgMeAChgjGDDLqXkgMPTJtZ3KJzDhTZpmtK2OSO5IRB6xvQDRAhOsb5Lx1lOu5ZCHV4B6RLUExvh4s+ZntHhDJAxSqs9TCDBqsc6j0iJdqtMuTROFBkIcllCCGcSytFNfm1tU8k2GRo2pOI43h9ie6tOvTJFbORyDsJFQHKD8fw+P9dWqJZ/I96TdEa5Nb1AOavjVfti0dfB+t4iXhWvyh27y9zEbRRobG7z6fgVeqSoKvB5oIMQEODx7FLvIJo55KS9R7b5ldrDReajpC+Z5z7GAHJFXn1exedVbG36ijwOmJgl0kS7lXtjD0DkLyqc70uPnSuIIwk9QCmWd+9XGnOFDzP/M5xxBInhLYBcd5z/AAZv2pOvFcS/AAAAAElFTkSuQmCC',
            strokeImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAACfSURBVCjPY/jPgB8yUFNBiWDBzOy01PKEmZG7sSrIe5dVDqIjygP/Y1GQm5b2P7kDwvbAZkK6S8L/6P8hM32N/zPYu2C1InJ36P/A/x7/bc+YoSooLy3/D4Px/23+SyC5G8kEf0EIbZSmfdfov9wZDCvc0uzLYWyZ/2J3MRTYppn/14eaIvKOvxxDgUma7ju1M/LlkmnC5bwdNIoL7BAAWzr8P9A5d4gAAAAASUVORK5CYII=',
            subscriptImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpERkYyQjI1ODA4RDNFMTExQTVBRjgxRDBDNDA3RkJBRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3NTcyMEQ1RkQzNEMxMUUxOTA2Q0FEQ0FBQTZGRjZEQyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3NTcyMEQ1RUQzNEMxMUUxOTA2Q0FEQ0FBQTZGRjZEQyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgV2luZG93cyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFCNjY1QTM0NEFEM0UxMTFBNkYxRURGM0E4QUREQTEwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRGRjJCMjU4MDhEM0UxMTFBNUFGODFEMEM0MDdGQkFFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+HVL3WgAAAMxJREFUKM9j+M+AHzIMGQVLHJZdWPx/xv+WgGyHoP82D4wdMEyYoTD5Q9v/AoXgCeYXDASwWlHfUPA/7ILFBX0BHG5IEwj9YPVf3wCnI70czP/r/1dfAOOvUKoQRFJgaWD8QNdB7YH8fykFEH9b6IwzgWfgCowM9B5oAg2XLZD4L3IAJNJ9N9ZF6520MViBXoLWB9UL8kCdYguE/gv855/gb2z2Tt1Y4h3UBA0DZQdZBwmg6wUd+B34gFBLUO6dyCr+cjwhKezClwZhAQCz7O+bUgO2KAAAAABJRU5ErkJggg==',
            superscriptImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpERkYyQjI1ODA4RDNFMTExQTVBRjgxRDBDNDA3RkJBRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo2MzYyMzhEQkQzNEMxMUUxQkQyRkMzMTJFQzY1M0MwMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2MzYyMzhEQUQzNEMxMUUxQkQyRkMzMTJFQzY1M0MwMCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgV2luZG93cyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjVCNDlCN0Q4MEJEM0UxMTFBNUFGODFEMEM0MDdGQkFFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRGRjJCMjU4MDhEM0UxMTFBNUFGODFEMEM0MDdGQkFFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+GdwPmAAAAMxJREFUKM9j+M+AHzKQqWD1u3n/U9P0/yuX41DQaJz4Ti9NuhyPFdrvJM/gdYPUKoE0uIIlDssuLP4/439LQLZD0H+bB8YOioLCZ1AcOUNh8oe2/wUKwRPMLxgIaM6UeidgjOaL+oaC/2EXLC7oC+DwZppA6Aer//oGOMPBy8H8v/5/9QU4FFgaGD/QdVB7IP9fSgGLAiMDvQeaQMNlCyT+ixzAUKCXoPVB9YI8UKfYAqH/Av/5J6Ap0DBQdpB1kAC6XtCB34EPCEmKTQCZjPE4N8a4DgAAAABJRU5ErkJggg==',
            insertImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1ODQ5QjdEODBCRDNFMTExQTVBRjgxRDBDNDA3RkJBRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERDFFOThDM0QzNEIxMUUxQjgxNkMyNTE3NDU5NkE1QiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERDFFOThDMkQzNEIxMUUxQjgxNkMyNTE3NDU5NkE1QiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgV2luZG93cyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFBNjY1QTM0NEFEM0UxMTFBNkYxRURGM0E4QUREQTEwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjU4NDlCN0Q4MEJEM0UxMTFBNUFGODFEMEM0MDdGQkFFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+iqTydQAAATFJREFUeNrMUz1qhGAQHUN6sREvEdjcQDvLHGHrNEntKdKlzQGsbfUIGmyVBQvx/xf8RTMjCEEXdrNJkQFR5pv3vvdmRmaeZ/hNMP+LQNM0EV9i3/dQ1zXkeQ5ZlhlJkpyCIDj6vg9VVcE4jh+WZZ3OKlBV9a3ruhcqTNNUUhTFoLwkSWJZljqePdq2ba71d1tJeGuOt0IURbCCKXRdN9q2he9givstAclsmgZQ9s4vEWxjR+B5HqBUCMPwNgLXdRcC9LorHobhMkEcx0shTWIb2H1rm9s1Ef2b1AN6BEE4rHmO4w7TNOUXCdCnSV5JASoR1zyCX3HkxlWbyPP8Ey0Lglg8X2WbRVEcf7TKLMsuFhBoXrXKDMN8yrL8QN+O4yxjQyVwZleeEff+Jz/TlwADADkE3v7LFnqxAAAAAElFTkSuQmCC',
            previewImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC',
            header = document.getElementsByTagName('head')[0],
            cssInlineDom = document.createElement('style');
            
        // Execute markItUp! once it's loaded.
        function doMarkItUpInit() {
            var settings = {
                nameSpace: 'bored',
                resizeHandle: true,
                previewAutoRefresh: true,
                onShiftEnter: {
                    keepDefault: false,
                    replaceWith: '\n\n'
                },
                markupSet: [
                   {name:'Bold', key:'B', closeWith:'(!(*|!|*])!)',
                    openWith:'(!(*|!|[*)!)', multiline: true}, 
                    {name:'Italic', key:'I', closeWith:'(!(_|!|_])!)',
                     openWith:'(!(_|!|[_)!)', multiline: true},
                    {name:'Strike-through', key:'S', closeWith:'(!(-|!|-])!)',
                     openWith:'(!(-|!|[-)!)', multiline: true},
                    {name:'Underline', key:'U', closeWith:'(!(+|!|+])!)',
                     openWith:'(!(+|!|[+)!)', multiline: true},
                    {separator:'---------------' },
                    {name:'Picture', replaceWith:'![![Source:!:http://]!]' +
                                                 '([![Alternative text]!])!'},
                    {name:'Link', openWith:'"',
                     closeWith:'([![Title]!])":' +'[![Link:!:http://]!]',
                     placeHolder:'Your text to link here...',
                     multiline: true },
                    {separator:'---------------' },
                    {name:'Superscript', closeWith:'(!(^]|!|^)!)',
                     openWith:'(!([^|!|^)!)', multiline: true},
                    {name:'Subscript', closeWith:'(!(~]|!|~)!)',
                     openWith:'(!([~|!|~)!)', multiline:true},
                    {name:'Code', openWith:'@', closeWith:'@', multiline: true},
                    {separator:'---------------' },
                    {name:'Preview', call:'preview', className:'prevButton'}
                ]
            };
        
            function markCommentBodyUp() {
                $('textarea').each(function () {
                    var $this = $(this);
                    if (!$this.data('wysiwiymEnabled')) {
                        var stsr = new SimpleTextileSubsetRenderer($this); 
                        settings.previewHandler = function (str) {
                            stsr.render(str);
                        };
                        $this.markItUp(settings);
                        $this.data('wysiwiymEnabled', true);
                    }
                });
            }
            
            // AJAX binding.
            markCommentBodyUp();
            $('#comments').ajaxComplete(markCommentBodyUp);
        }
        
        if (document.getElementsByTagName('textarea').length) {
            // MarkItUp! JS
            var markItUp = document.createElement('script');
            markItUp.setAttribute('src', 'https://s3.amazonaws.com/Linkable' +
                                         'Libraries/jquery.markitup.js');
            header.appendChild(markItUp);
            markItUp.addEventListener('load', function () {
                doMarkItUpInit();
            }, false);
            
            // MarkItUp! CSS
            cssInlineDom.setAttribute('type', 'text/css');
            cssInlineDom.textContent = 
                '.markItUp * {' +
                '    margin:0px; padding:0px;' +
                '    outline:none;' +
                '}' +
                '.markItUp a:link,' +
                '.markItUp a:visited {' +
                '    color:#000;' +
                '    text-decoration:none;' +
                '}' +
                '.markItUp {' +
                '    width:700px;' +
                '    margin:5px 0 5px 180px;' +
                '    border:5px solid #F5F5F5;	' +
                '}' +
                '.markItUpContainer {' +
                '  border:1px solid #3C769D;	' +
                '  background:#FFF;'+
                '  padding:5px 5px 2px 5px;' +
                '  font:11px Verdana, Arial, Helvetica, sans-serif;' +
                '}' +
                '.markItUpEditor {' +
                '    font:12px "Courier New", Courier, monospace;' +
                '    padding:5px 5px 5px 5px;' +
                '    border:3px solid #3C769D;' +
                '    width:670px !important;' +
                '    height:320px;' +
                '    clear:both;' +
                '    line-height:18px;' +
                '    overflow:auto;' +
                '}' +
                '.markItUpPreviewFrame	{' +
                '    overflow:auto;' +
                '    background-color:#FFFFFF;' +
                '    border:1px solid #3C769D;' +
                '    width:99.9%;' +
                '    height:300px;' +
                '    margin:5px 0;' +
                '}' +
                '.markItUpFooter {' +
                '    width:100%;' +
                '    cursor:n-resize;' +
                '}' +
                '.markItUpResizeHandle {' +
                '    overflow:hidden;' +
                '    width:22px; height:5px;' +
                '    margin-left:auto;' +
                '    margin-right:auto;' +
                '    background-image:url(' + handleImg + ');' +
                '    cursor:n-resize;' +
                '}' +
                '/* first row of buttons */' +
                '.markItUpHeader ul li	{' +
                '    list-style:none;' +
                '    float:left;' +
                '    position:relative;' +
                '}' +
                '.markItUpHeader ul li ul{' +
                '    display:none;' +
                '}' +
                '.markItUpHeader ul li:hover > ul{' +
                '    display:block;' +
                '}' +
                '.markItUpHeader ul .markItUpDropMenu li {' +
                '    margin-right:0px;' +
                '}' +
                '.markItUpHeader ul .markItUpSeparator {' +
                '    margin:0 10px;' +
                '    width:1px;' +
                '    height:16px;' +
                '    overflow:hidden;' +
                '    background-color:#CCC;' +
                '}' +
                '.markItUpHeader ul ul .markItUpSeparator {' +
                '    width:auto; height:1px;' +
                '    margin:0px;' +
                '}' +
                '/* next rows of buttons */' +
                '.markItUpHeader ul ul {' +
                '    display:none;' +
                '    position:absolute;' +
                '    top:18px; left:0px;	' +
                '    background:#F5F5F5;' +
                '    border:1px solid #3C769D;' +
                '    height:inherit;' +
                '}' +
                '.markItUpHeader ul ul li {' +
                '    float:none;' +
                '    border-bottom:1px solid #3C769D;' +
                '}' +
                '/* next rows of buttons */' +
                '.markItUpHeader ul ul ul {' +
                '    position:absolute;' +
                '    top:-1px; left:150px;' +
                '}' +
                '.markItUpHeader ul ul ul li {' +
                '    float:none;' +
                '}' +
                '.markItUpHeader ul a {' +
                '    display:block;' +
                '    width:16px; height:16px;' +
                '    text-indent:-10000px;' +
                '    background-repeat:no-repeat;' +
                '    padding:3px;' +
                '    margin:0px;' +
                '}' +
                '.markItUpHeader ul ul a {' +
                '    display:block;' +
                '    padding-left:0px;' +
                '    text-indent:0;' +
                '    width:120px;' +
                '    padding:5px 5px 5px 25px;' +
                '    background-position:2px 50%;' +
                '}' +
                '.markItUpHeader ul ul a:hover {' +
                '    color:#FFF;' +
                '    background-color:#3C769D;' +
                '}' +
                '.bored .markItUpButton1 a {' +
                '    background-image:url(' + boldImg + ');' +
                '}' +
                '.bored .markItUpButton2 a {' +
                '    background-image:url(' + italicImg + ');' +
                '}' +
                '.bored .markItUpButton3 a {' +
                '    background-image:url(' + strokeImg + ');' +
                '}' +
                '.bored .markItUpButton4 a {' +
                '    background-image:url(' + insertImg + ');' +
                '}' +
                '.bored .markItUpButton5 a {' +
                '    background-image:url(' + pictureImg + ');' +
                '}' +
                '.bored .markItUpButton6 a {' +
                '    background-image:url(' + linkImg + ');' +
                '}' +
                '.bored .markItUpButton7 a	{' +
                '    background-image:url(' + superscriptImg + ');' +
                '}' +
                '.bored .markItUpButton8 a	{' +
                '    background-image:url(' + subscriptImg + ');' +
                '}' +
                '.bored .markItUpButton9 a	{' +
                '    background-image:url(' + codeImg + ');' +
                '}' +
                '.bored .prevButton a {' +
                '   background-image:url(' + previewImg + ');' +
                '}' +
                '.textile_preview {' +
                '   margin:5px 0 0 180px;' +
                '}' +
                '.textile_preview h5 {' +
                '   margin-top: 5px;' +
                '}';
    
            header.appendChild(cssInlineDom);
        }
    }
   
    // Execution.
    BOREDConfig.loadSettings();
    BOREDConfig.makePanel();
    
    if (BOREDConfig.SHOW_ZOOM_CURSOR) {
        ZoomCursors();
    }
  
    if (BOREDConfig.MOVE_WATCHED_LINK) {
        moveWatched();
    }

    if (BOREDConfig.SHOW_REVERSE_SEARCH_LINKS && $('div#image_target').length) {
        relImages();
    }
    
    if (BOREDConfig.ENABLE_FILE_UPLOAD_PREVIEW) {
        $imageInput = $('input#image_image');
        if ($imageInput.length) {
            imagePreview($imageInput);
        }
    }
    
    if ($('textarea').length || $('#comments').length) {
        if ($('#comments').length) {
            new CommentImagesToggler();

            if (BOREDConfig.SHOW_COMMENT_LINKS) {
                commentLinking();
            }
            if (BOREDConfig.HIDE_COMMENT_IMAGES) {
                toggleCommentImages(true);
            } else if (BOREDConfig.AUTO_EXPAND_COMMENT_IMAGES) {
                makeCommentImagesExpandable();
            }
        }
        if (BOREDConfig.ENABLE_MARKITUP) {
            doMarkItUp();
        }
    }
    
    // Honestly, this is a bit insulting to the site, but I figured it'd be
    // fun to do and actually looks good with the format. Only the link is
    // changed. I should add the sidebar thing later.
    if (BOREDConfig.NOSTALGIA_MODE) {
        $('div#header > a:first-child').text('Ponibooru')
                                       .css({
                                           fontWeight: 'bold',
                                           color: '#006FFA'
                                       }).hover(function () {
                                           $(this).css('color', '#33CFFF');
                                       }, function () {
                                           $(this).css('color', '#006FFA');
                                       });
    }   
}

// if __name__ == '__main__':
(function () {
    'use strict';
    
    var script = document.createElement('script');

    script.textContent = '(' + BOREDInit.toString() + ')();';
    document.body.appendChild(script);
}());