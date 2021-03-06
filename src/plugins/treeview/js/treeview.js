// import Collapse from './collapse';
import { getjQuery, typeCheckConfig, element, getUID } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const Collapse = window.mdb.Collapse;

const NAME = 'treeview';
const DATA_KEY = 'mdb.treeview';

const EVENT_SELECT = 'select.mdb.treeview';
const EVENT_HIDE_COLLAPSE = 'hide.bs.collapse';
const EVENT_SHOW_COLLAPSE = 'show.bs.collapse';

const SELECTOR_INNER_ULS = 'ul:not([role="tree"])';
const SELECTOR_TREEVIEW = '.treeview';
const SELECTOR_ICON_SPAN = 'span[aria-label="toggle"]';
const SELECTOR_ARROW_ICON = 'i';
const SELECTOR_CHECKBOX = 'input[type="checkbox"]';

const CLASSNAME_TREEVIEW = 'treeview';
const CLASSNAME_COLLAPSE = 'collapse';
const CLASSNAME_SHOW = 'show';
const CLASSNAME_FORM_INPUT = 'form-check-input';
const CLASSNAME_SELECTED = 'active';
const CLASSNAME_CATEGORY = 'treeview-category';

const DefaultType = {
  structure: '(null|array)',
  openOnClick: 'boolean',
  selectable: 'boolean',
  accordion: 'boolean',
  rotationAngle: 'number',
  treeviewColor: 'string',
};

const Default = {
  structure: null,
  openOnClick: true,
  selectable: false,
  accordion: false,
  rotationAngle: 90,
  treeviewColor: 'primary',
};

class Treeview {
  constructor(element, data) {
    this._element = element;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this._options = this._getConfig(data);

    this._innerLists = [];

    this._init();

    this._checkboxes = SelectorEngine.find(SELECTOR_CHECKBOX, this._mainList);

    this._listElements = SelectorEngine.find('li', this._mainList);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get parsedDOM() {
    return this._parseDOM(this._element);
  }

  get selectedItems() {
    return SelectorEngine.find(SELECTOR_CHECKBOX, this._mainList)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => {
        const [parent] = SelectorEngine.parents(checkbox, 'li');

        return parent;
      });
  }
  // Public

  dispose() {
    Data.removeData(this._element, DATA_KEY);

    this._checkboxes.forEach((checkbox) => {
      EventHandler.off(checkbox, 'change');
    });

    this._listElements.forEach((item) => {
      EventHandler.off(item, 'click');
      EventHandler.off(item, 'mouseover');
      EventHandler.off(item, 'mouseout');
    });

    // collapse

    this._innerLists.forEach((list) => {
      list.collapse.dispose();

      const [toggler] = SelectorEngine.parents(list.toggler, 'a');

      EventHandler.off(toggler, 'click');
    });

    this._element = null;
  }

  collapse() {
    SelectorEngine.find('ul', this._mainList).forEach((el) => {
      if (Manipulator.hasClass(el, CLASSNAME_SHOW)) {
        const { collapse } = this._getInnerList(el);

        collapse.hide();
      }
    });
  }

  expand(ID) {
    const target = SelectorEngine.findOne(`#${ID}`, this._mainList);

    const parents = SelectorEngine.parents(target, SELECTOR_INNER_ULS);

    [target, ...parents].forEach((el) => {
      if (!Manipulator.hasClass(el, CLASSNAME_SHOW)) {
        const { collapse } = this._getInnerList(el);

        collapse.show();
      }
    });
  }

  // Private

  _init() {
    if (this._options.structure) {
      this._initJS();
    } else {
      this._initDOM();
    }
  }

  _initJS() {
    this._generateMainList();

    Manipulator.addClass(this._element, CLASSNAME_TREEVIEW);

    this._options.structure.forEach((treeNode) => this._generateTree(treeNode, this._mainList));

    this._initDOM();
  }

  _initDOM() {
    this._setupMainList();

    this.parsedDOM.forEach((treeNode) => this._setupTree(treeNode, 1, this._mainList));

    if (this._options.treeviewColor) {
      this._setupColors();
    }
  }

  _setupColors() {
    const colors = [
      'primary',
      'secondary',
      'warning',
      'success',
      'info',
      'danger',
      'light',
      'dark',
    ];
    const colorClass = colors.includes(this._options.treeviewColor)
      ? `treeview-${this._options.treeviewColor}`
      : 'treeview-primary';

    return Manipulator.addClass(this._element, colorClass);
  }

  _getInnerList(ul) {
    return this._innerLists.find((list) => list.element === ul);
  }

  _generateTree(treeNode, parent) {
    const { name, children, show, id, icon } = treeNode;

    const li = element('li');

    if (children) {
      const a = element('a');
      const ul = element('ul');

      a.innerHTML = name;

      li.appendChild(a);
      li.appendChild(ul);

      if (show) {
        Manipulator.addClass(ul, CLASSNAME_SHOW);
      }

      if (id) {
        ul.setAttribute('id', id);
      }

      if (icon) {
        const toggler = element('span');
        toggler.setAttribute('aria-label', 'toggle');
        toggler.innerHTML = icon;

        a.insertBefore(toggler, a.firstChild);
      }

      children.forEach((childNode) => this._generateTree(childNode, ul));
    } else {
      li.innerHTML = name;
    }

    parent.appendChild(li);
  }

  _generateMainList() {
    this._mainList = element('ul');

    return this._element.appendChild(this._mainList);
  }

  _setupMainList() {
    this._mainList = SelectorEngine.findOne('ul', this._element);

    this._mainList.setAttribute('role', 'tree');
  }

  _setupTree(treeNode, level, parent) {
    const { node, children } = treeNode;

    this._setupTreeItem(node, level);

    if (children.length > 0) {
      this._setupGroupItem(node, children, level, parent);
    }
  }

  _setupTreeItem(el, level) {
    el.setAttribute('role', 'tree-item');

    el.setAttribute('aria-level', level);

    if (this._options.selectable) {
      this._setupCheckbox(el);
    }

    const aElement = SelectorEngine.findOne('a', el);

    if (aElement) {
      Manipulator.addClass(aElement, CLASSNAME_CATEGORY);
    } else {
      Manipulator.addClass(el, CLASSNAME_CATEGORY);
    }

    EventHandler.on(el, 'click', (e) => this._handleItemClick(e, el));
  }

  _setupGroupItem(el, children, level, parent) {
    const aElement = SelectorEngine.findOne('a', el);

    const [childUl] = SelectorEngine.children(el, 'ul');

    let ID;

    if (!childUl.hasAttribute('id')) {
      ID = getUID('level-');
    } else {
      ID = `level-${childUl.getAttribute('id')}`;
    }

    childUl.setAttribute('id', ID);

    const arrow = this._setupArrow(el, ID, aElement);

    childUl.setAttribute('role', 'group');

    aElement.setAttribute('role', 'button');

    // Collapse

    const show = Manipulator.hasClass(childUl, CLASSNAME_SHOW);
    Manipulator.removeClass(childUl, CLASSNAME_SHOW);

    const collapseInstance = new Collapse(childUl, {
      parent: this._options.accordion ? parent : '',
      toggle: show,
    });

    if (show) {
      this._rotateIcon(arrow, 90);
    }

    EventHandler.on(childUl, EVENT_SHOW_COLLAPSE, (e) => {
      e.stopPropagation();

      this._rotateIcon(arrow, this._options.rotationAngle);
    });

    EventHandler.on(childUl, EVENT_HIDE_COLLAPSE, (e) => {
      e.stopPropagation();

      this._rotateIcon(arrow, 0);

      // Collapse inner lists

      SelectorEngine.find('ul', childUl).forEach((list) => {
        Collapse.getInstance(list).hide();
      });
    });

    // Inner lists
    this._innerLists.push({
      element: childUl,
      collapse: collapseInstance,
      toggler: arrow,
    });

    children.forEach((childNode) => this._setupTree(childNode, level + 1, childUl));
  }

  _createCheckbox() {
    const checkbox = element('input');

    Manipulator.addClass(checkbox, CLASSNAME_FORM_INPUT);
    Manipulator.addClass(checkbox, 'mx-1');

    checkbox.setAttribute('type', 'checkbox');

    return checkbox;
  }

  _setupCheckbox(el) {
    const checkbox = this._createCheckbox();

    const aElement = SelectorEngine.findOne('a', el);

    if (aElement) {
      aElement.insertBefore(checkbox, aElement.firstChild);
    } else {
      el.insertBefore(checkbox, el.firstChild);
    }

    EventHandler.on(checkbox, 'change', (e) => this._handleCheckbox(e, el));
  }

  _handleCheckbox(e, el) {
    const { checked } = e.target;

    const parents = SelectorEngine.parents(el, 'li');

    const [firstParent] = parents;

    const parentCheckbox = SelectorEngine.findOne(SELECTOR_CHECKBOX, firstParent);

    if (firstParent && parentCheckbox.checked && !checked) {
      parents.forEach((parent) => {
        const parentCheck = SelectorEngine.findOne(SELECTOR_CHECKBOX, parent);

        parentCheck.checked = false;
      });
    }
    const childCheckboxes = SelectorEngine.find(SELECTOR_CHECKBOX, el);

    if (checked) {
      childCheckboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
    } else {
      childCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    }

    EventHandler.trigger(this._element, EVENT_SELECT, {
      items: this.selectedItems,
    });
  }

  _handleItemClick(e, el) {
    e.stopPropagation();

    const listElements = SelectorEngine.find('li', this._mainList);

    listElements.forEach((el) => {
      Manipulator.removeClass(el, CLASSNAME_SELECTED);

      const aElement = SelectorEngine.findOne('a', el);

      if (aElement) {
        Manipulator.removeClass(aElement, CLASSNAME_SELECTED);
      }
    });

    const innerList = SelectorEngine.findOne('ul', el);

    if (innerList) {
      const innerAElement = SelectorEngine.findOne('a', el);

      Manipulator.addClass(innerAElement, CLASSNAME_SELECTED);
    } else {
      Manipulator.addClass(el, CLASSNAME_SELECTED);
    }
  }

  _setupArrow(el, id, aElement) {
    const existingSpan = SelectorEngine.findOne(SELECTOR_ICON_SPAN, aElement);

    if (existingSpan) {
      const selector = this._options.openOnClick ? aElement : existingSpan;

      Manipulator.setDataAttribute(selector, 'toggle', CLASSNAME_COLLAPSE);

      Manipulator.setDataAttribute(selector, 'target', `#${id}`);

      return existingSpan;
    }

    return this._createArrow(el, id, aElement);
  }

  _createArrow(el, id, aElement) {
    const arrow = element('span');

    const selector = this._options.openOnClick ? aElement : arrow;

    arrow.setAttribute('aria-label', 'toggle');

    arrow.innerHTML = '<i class="fas fa-angle-right mx-1"></i>';

    Manipulator.setDataAttribute(selector, 'toggle', CLASSNAME_COLLAPSE);

    Manipulator.setDataAttribute(selector, 'target', `#${id}`);

    aElement.insertBefore(arrow, aElement.firstChild);

    return arrow;
  }

  _parseDOM(el) {
    const [list] = SelectorEngine.children(el, 'ul');

    if (!list) return [];

    return SelectorEngine.children(list, 'li').map((node) => {
      const children = this._parseDOM(node);

      return {
        name: node.innerText ? node.innerText.split('\n')[0] : '',
        node,
        children,
      };
    });
  }

  _rotateIcon(toggler, angle) {
    const toggleIcon = SelectorEngine.findOne(SELECTOR_ARROW_ICON, toggler);

    if (toggleIcon) {
      Manipulator.style(toggleIcon, {
        transform: `rotate(${angle}deg)`,
      });
    }
  }

  _getConfig(options) {
    const config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };
    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  // Static

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data) {
        data = new Treeview(this, _config);
      }
      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      }
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_TREEVIEW).forEach((treeview) => {
  let instance = Treeview.getInstance(treeview);
  if (!instance) {
    instance = new Treeview(treeview);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

const $ = getjQuery();
if ($) {
  const JQUERY_NO_CONFLICT = $.fn[NAME];
  $.fn[NAME] = Treeview.jQueryInterface;
  $.fn[NAME].Constructor = Treeview;
  $.fn[NAME].noConflict = () => {
    $.fn[NAME] = JQUERY_NO_CONFLICT;
    return Treeview.jQueryInterface;
  };
}
export default Treeview;
