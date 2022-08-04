
function isTextVdom(vdom) {
    return typeof vdom == 'string' || typeof vdom == 'number';
}

function isElementVdom(vdom) {
    return typeof vdom == 'object' && typeof vdom.type == 'string';
}

function isComponentVdom(vdom) {
    return typeof vdom.type == 'function';
}

const render = (vdom, parent = null) => {
    const mount = parent ? (el => parent.appendChild(el)) : (el => el);
    if (isTextVdom(vdom)) {
        return mount(document.createTextNode(vdom));
    } else if (isElementVdom(vdom)) {
        const dom = mount(document.createElement(vdom.type));
        for (const child of [].concat(...vdom.children)) {// children 元素也是 数组，要拍平
            render(child, dom);
        }
        for (const prop in vdom.props) {
            setAttribute(dom, prop, vdom.props[prop]);
        }
        return dom;
    } else if (isComponentVdom(vdom)) {
        return renderComponent(vdom, parent);
    } else {
        throw new Error(`Invalid VDOM: ${vdom}.`);
    }
};

function renderComponent(vdom, parent) {
    const props = Object.assign({}, vdom.props, {
        children: vdom.children
    });

    if (Component.isPrototypeOf(vdom.type)) {
        const instance = new vdom.type(props);

        instance.componentWillMount();

        const componentVdom = instance.render();
        instance.dom = render(componentVdom, parent);
        //  记录dom是用什么组件渲染出来的
        instance.dom.__instance = instance;
        //  用于对元素的重用
        instance.dom.__key = vdom.props.key;

        instance.componentDidMount();

        return instance.dom;
    } else {
        const componentVdom = vdom.type(props);
        return render(componentVdom, parent);
    }
}

function patch(dom, vdom, parent = dom.parentNode) {
    //  用replaceChild实现replace
    const replace = parent ? el => {
        parent.replaceChild(el, dom);
        return el;
    } : (el => el);

    if(isComponentVdom(vdom)) {
        const props = Object.assign({}, vdom.props, {children: vdom.children});
        //  同一个组件，因此patch子元素
        if (dom.__instance && dom.__instance.constructor == vdom.type) {
            dom.__instance.componentWillReceiveProps(props);
            dom.__instance.props = props;
            return patch(dom, dom.__instance.render(), parent);
        } else if (Component.isPrototypeOf(vdom.type)) {
            //  Class组件的替换
            const componentDom = renderComponent(vdom, parent);
            if (parent){
                parent.replaceChild(componentDom, dom);
                return componentDom;
            } else {
                return componentDom
            }
        } else if (!Component.isPrototypeOf(vdom.type)) {
            //  function组件的替换
            return patch(dom, vdom.type(props), parent);
        }
    }else if (dom instanceof Text) {
        //  dom节点是文本
        if (typeof vdom === 'object') {
            //  vdom节点不是文本节点，直接替换
            return replace(render(vdom, parent));
        } else {
            //  vdom节点也是文本节点，则对比内容，内容不一样就替换
            return dom.textContent != vdom ? replace(render(vdom, parent)) : dom;
        }
    } else if (dom.nodeName !== vdom.type.toUpperCase() && typeof vdom === 'object') {
        //  不同类型的元素，直接替换
        return replace(render(vdom, parent));
    } else if(dom.nodeName === vdom.type.toUpperCase() && typeof vdom === 'object'){
        const active = document.activeElement;


        //  拍平数组，循环渲染vdom的children
        //  找到对应的key就直接复用，继续patch它的子元素
        //  未找到，则render一个新的
        const oldDoms = {};
        [].concat(...dom.childNodes).map((child, index) => {
            const key = child.__key || `__index_${index}`;
            oldDoms[key] = child;
        });
        [].concat(...vdom.children).map((child, index) => {
            const key = child.props && child.props.key || `__index_${index}`;
            dom.appendChild(oldDoms[key] ? patch(oldDoms[key], child) : render(child, dom));
            delete oldDoms[key];
        });
        //  因为新的dom已从oldDoms里去掉，因此剩下的都是不再需要的，直接删掉
        //  执行组件的willUnmount的生命周期函数
        for (const key in oldDoms) {
            const instance = oldDoms[key].__instance;
            if (instance) instance.componentWillUnmount();
            oldDoms[key].remove();
        }
        //  删除旧的属性
        for (const attr of dom.attributes) dom.removeAttribute(attr.name);
        //  设置新的props
        for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);

        active.focus();

        return dom;
    }
}

function isEventListenerAttr(key, value) {
    return typeof value == 'function' && key.startsWith('on');
}

function isStyleAttr(key, value) {
    return key == 'style' && typeof value == 'object';
}

function isPlainAttr(key, value) {
    return typeof value != 'object' && typeof value != 'function';
}

//  支持ref属性
function isRefAttr(key, value) {
    return key === 'ref' && typeof value === 'function';
}

const setAttribute = (dom, key, value) => {
    //  每次event listener 都先remove 在add，确保render多次也始终只有一个
    if (isEventListenerAttr(key, value)) {
        const eventType = key.slice(2).toLowerCase();
        dom.__handlers = dom.__handlers || {};
        dom.removeEventListener(eventType, dom.__handlers[eventType]);
        dom.__handlers[eventType] = value;
        dom.addEventListener(eventType, dom.__handlers[eventType]);
    } else if (key == 'checked' || key == 'value' || key == 'className') {
        dom[key] = value;
    } else if(isRefAttr(key, value)) {
        value(dom);
    } else if (isStyleAttr(key, value)) {
        Object.assign(dom.style, value);
    } else if (key == 'key') {
        dom.__key = value;
    } else if (isPlainAttr(key, value)) {
        dom.setAttribute(key, value);
    }
}

const createElement = (type, props, ...children) => {
    if (props === null)  props = {};
    return {type, props, children};
};

class Component {
    constructor(props) {
        this.props = props || {};
        this.state = null;
    }
  
    //  把渲染的dom和已有的dom做下diff，只更新需要更新的dom
    setState(nextState) {
        this.state = Object.assign(this.state, nextState);
        if(this.dom && this.shouldComponentUpdate(this.props, nextState)) {
            patch(this.dom, this.render());
        }
    }

    //  如果 props 和 state 都没变就不用 patch
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps != this.props || nextState != this.state;
    }

    componentWillMount() {}
  
    componentDidMount() {}

    componentWillReceiveProps() {}

    componentWillUnmount() {}
}
