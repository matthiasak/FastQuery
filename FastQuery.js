function FastQuery(options){
    // default
    var defaults = {
            body: document.body,
        }
        , self = this;
    options = this.extend({}, defaults, options)

    // for each option, set it as a local variable under this instance
    for(var i in options){
        this[i] = options[i];
    }
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

FastQuery.prototype.selectId = function(id, html_element)
{
    !html_element && (html_element = this.body);
    return html_element.getElementById(id);
};

FastQuery.prototype.selectClass = function(_class, html_element)
{
    !html_element && (html_element = this.body);
    return html_element.getElementsByClassName ? html_element.getElementsByClassName(_class.substr(1, _class.length)) : html_element.querySelectorAll(_class);
};

FastQuery.prototype.selectTag = function(tag, html_element)
{
    !html_element && (html_element = this.body);
    return html_element.getElementsByTagName(tag);
};

/* Want to use events with IE8? Get the addEventListener polyfill */
FastQuery.prototype.registerEvent = function(el, event, handler){
    el.addEventListener(event, handler, false);
}

/* Want to use events with IE8? Get the addEventListener polyfill */
FastQuery.prototype.detachEvent = function(el, event, handler){
    el.removeEventListener(event, handler, false);
}

FastQuery.prototype.handlerMapping = {};
FastQuery.prototype.guidKey = 'FastQuery_handler';
FastQuery.prototype.nextGuid = 0;
FastQuery.prototype.newGuid = function(){
    return this.nextGuid++;
};

FastQuery.prototype.delegatedHandler = function(target, handler, html_element){
    var self = this;

    !html_element && (html_element = this.body);

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
        this.handlerMapping[guid] = null;
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
    html_element.classList ? html_element.classList.add(_class) : (html_element.className += ' '+_class);
}

FastQuery.prototype.removeClass = function(html_element, _class) {
    html_element.classList ? html_element.classList.remove(_class) : (html_element.className = html_element.className.replace(_class, ''));
}

FastQuery.prototype.hasClass = function(html_element, _class) {
    return html_element.classList ? html_element.classList.contains(_class) : html_element.className.match(new RegExp("(("+_class+"(\s))|((\s)"+_class+"))")).length > 0;
}

FastQuery.prototype.toggleClass = function(html_element, _class) {
    this.hasClass(html_element, _class) ? this.removeClass(html_element, _class) : this.addClass(html_element, _class);
}