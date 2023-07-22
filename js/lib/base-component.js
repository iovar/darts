import { updateCallbackSlots, updateTemplate, getEmptyTemplateState } from './dynamic-template.js';
import { getRemoteTemplate } from './remote-template.js';

export class BaseComponent extends HTMLElement {
    static get observedAttributes() { return [ 'data-props' ]; }
    static defaultOptions = { mode: 'open', withStyles: true, dynamic: true, inline: false };

    constructor(url /* import.meta.url */, options = {}) {
        super();
        const { mode, ...restOptions } = { ...BaseComponent.defaultOptions, ...options };
        this.attachShadow({ mode });
        this.initTemplate(url, restOptions);
    }

    async initTemplate(url, { withStyles, dynamic, inline }) {
        if (inline) {
            this.shadowRoot.innerHTML = url;
        } else {
            const basePath = new URL(url).pathname.replace(/.js$/, '');
            const templateURL = `${basePath}.html`;
            const stylesURL = withStyles ? `${basePath}.css` : null;
            this.shadowRoot.innerHTML = await getRemoteTemplate(templateURL, stylesURL);
        }

        if (dynamic) {
            this.dynamic = dynamic;
            this.state = getEmptyTemplateState();
            this.setProps(JSON.parse(this.dataset.props));
            updateCallbackSlots(this.shadowRoot, this);
        }
    }

    setStateValues(values) {
        if (values !== this.state.values) {
            this.state = {
                ...this.state,
                values,
                oldValues: this.state.values,
            };
            updateTemplate(this.shadowRoot, this);
        }
    }

    setProps(props) {
        if (props !== this.props) {
            this.oldProps = this.props || {};
            this.props = props;
            updateTemplate(this.shadowRoot, this);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-props' && this.dynamic) {
            const props = JSON.parse(newValue);
            this.setProps(props);
        }
    };
}
