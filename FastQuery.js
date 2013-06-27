function FastQuery(options){
    // optimized class selection
    this.selectClass = this.selectClass || (!this.isIE8 ? this.selectByClass : this.selectAny);

    // default
    var defaults = {
            body: this.selectTag('body', document)[0],
        }
        , self = this;
    options = this.extend({}, defaults, options)

    // for each option, set it as a local variable under this instance
    for(var i in options){
        this[i] = options[i];
    }

    this.elements = typeof this.selector === "string" ? this.select(this.selector, this.body) : this.elements;
}

FastQuery.prototype.extend = function(){
    var args = [].slice.call(arguments);
    var result = args[0] || {};
    var numArgs = args.length;

    for(var i = 1; i < numArgs; i++){
        var arg = args[i];
        for(var key in arg){
            if(arg.hasOwnProperty(key)){
                result[key] = arg[key];
            }
        }
    }

    return result;
}

FastQuery.prototype.isIE8 = function(){
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('msie') != -1 ? (parseInt(ua.split('msie')[1]) < 9) : false;
}();

FastQuery.prototype.isIE9 = function(){
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('msie') != -1 ? (parseInt(ua.split('msie')[1]) <= 9) : false;
}();

FastQuery.prototype.select = function(name, html_element){
    var _char = name.charAt(0);
    if(_char == '#'){
        return this.selectId(name.substr(1, name.length-1), html_element);
    } else if (_char == '.') {
        return this.selectClass(name, html_element);
    } else {
        return this.selectTag(name, html_element);
    }
};

FastQuery.prototype.selectId = function(name, html_element)
{
    return html_element.getElementById ? html_element.getElementById(name): html_element.querySelector(name);
};

FastQuery.prototype.selectByClass = function(name, html_element)
{
    return html_element.getElementsByClassName(name.substr(1, name.length-1));
};

FastQuery.prototype.selectAny = function(name, html_element){
    return html_element.querySelectorAll(name);
};

FastQuery.prototype.selectTag = function(name, html_element)
{
    return html_element.getElementsByTagName(name);
};

FastQuery.prototype.registerEvent = function(el, event, handler){
    if(!this.isIE8){
        // DOM Level 2 API
        el.addEventListener(event, handler, false);
        // return event;
    } else {
        // IE Legacy Model
        var bound = function(){
            return handler.apply(el, arguments);
        };
        el.attachEvent('on' + event, bound);
        // return bound;
    }
}

FastQuery.prototype.detachEvent = function(el, event, handler){
    if(!this.isIE8){
        // DOM Level 2 API
        el.removeEventListener(event, handler, false);
    } else {
        // IE Legacy Model
        el.detachEvent('on' + event, handler);
    }
}

FastQuery.prototype.handlerMapping = {};

FastQuery.prototype.guidKey = 'FastQuery_handler';

FastQuery.prototype.nextGuid = 0;

FastQuery.prototype.newGuid = function(){
    return this.nextGuid++;
};

FastQuery.prototype.delegatedHandler = function(target, handler, html_element){
    var self = this;

    // create intercepting handler to delegate only matching events
    var interceptor = function(event){
        var matching = self.select(target, html_element);
        if(matching.length > 0){
            var parents = [];
            var current = event.target;
            while(current){
                parents.push(current);
                current = current.parentNode;
            }
            for(var i = 0; i < matching.length; i++){
                if(parents.indexOf(matching[i]) !== -1){
                    return handler.call(matching[i], event);
                }
            }
        }
    };

    // add handler to mapping
    var guid = this.newGuid();
    handler[this.guidKey] = guid;
    this.handlerMapping[guid] = interceptor;

    return interceptor;
}

FastQuery.prototype.on = function(event, target, handler, html_element) {
    var numArgs = [].slice.call(arguments).length
        , html_element = numArgs === 4 ? html_element : handler
        , handler = numArgs === 4 ? handler : target;

    if(numArgs === 3){
        this.registerEvent(html_element, event, handler);
    } else if(numArgs === 4){
        var delegate = this.delegatedHandler(target, handler, html_element);
        this.registerEvent(html_element, event, delegate);
    }

    return this;
};

FastQuery.prototype.off = function(event, handler, html_element) {
    var guid;
    if((guid = handler[this.guidKey]) !== undefined){
        handler = this.handlerMapping[guid] || handler;
        delete this.handlerMapping[guid];
    }

    this.detachEvent(html_element, event, handler);

    return this;
};

FastQuery.prototype.trigger = function(element, eventName) {
    // safari, webkit, gecko
    if (document.createEvent)
    {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(eventName, true, true);
        return element.dispatchEvent(evt);
    }
 
    // Internet Explorer
    if (element.fireEvent) {
        return element.fireEvent('on' + eventName);
    }
};

/**
 * Retrieve query parameters from the URL
 */
FastQuery.prototype.getQueryParameter = function(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if(results == null) {
        return null;
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
};

FastQuery.prototype.addClass = function(html_element, _class) {
    if(!this.isIE9){
        html_element.classList.add(_class);
    } else {
        html_element.className += ' '+_class;
    }
}

FastQuery.prototype.removeClass = function(html_element, _class) {
    if(!this.isIE9){
        html_element.classList.remove(_class);
    } else {
        html_element.className = html_element.className.replace(_class, '');
    }
}

FastQuery.prototype.hasClass = function(html_element, _class) {
    if(!this.isIE9){
        return html_element.classList.contains(_class);
    } else {
        return html_element.className.match(new RegExp("(("+_class+"(\s))|((\s)"+_class+"))")).length > 0;
    }
}