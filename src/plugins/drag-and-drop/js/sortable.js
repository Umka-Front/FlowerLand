import { typeCheckConfig, getUID, getjQuery } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';
import Draggable from './draggable';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'sortable';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;
const CLASS_COMPONENT = 'sortable-list';
const CLASS_SORTABLE_ITEM = 'sortable-item';
const CLASS_SORTABLE_ITEM_DRAGGING = 'sortable-item-dragging';
const SELECTOR_COMPONENT = '[data-sortable="sortable"]';
const SELECTOR_SORTABLE_ITEM = `.${CLASS_SORTABLE_ITEM}`;

const DEFAULT_OPTIONS = {
  connectedList: null,
  copy: false,
  sorting: true,
  enterPredicate: () => true,
  animationDuration: 300,
};

const OPTIONS_TYPE = {
  connectedList: 'element|null|string',
  copy: 'boolean',
  sorting: 'boolean',
  enterPredicate: 'function',
  animationDuration: 'number',
};

const EVENT_MOVE = `move${EVENT_KEY}`;
// const EVENT_ENTER = `enter${EVENT_KEY}`;
const EVENT_EXIT = `exit${EVENT_KEY}`;

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Sortable {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;
    this._listElements = this._getListElements();
    this._draggingObject = null;
    this._initialX = 0;
    this._initialY = 0;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);

      this._handleMouseEnter = this._handleMouseEnter.bind(this);
      this._handleDragStart = this._handleDragStart.bind(this);

      this._initSortableElements = this._initSortableElements.bind(this);
      this._handleMouseOverConnTab = this._handleMouseOverConnTab.bind(this);

      this._setup();
    }
  }

  // Getters
  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  get _listItems() {
    return SelectorEngine.find(SELECTOR_SORTABLE_ITEM, this._element);
  }

  get _connectedListInstance() {
    const { connectedList } = this.options;
    const isSelector = typeof connectedList === 'string';

    if (isSelector) {
      const connListEl = SelectorEngine.findOne(connectedList);
      return connListEl ? Sortable.getInstance(connListEl) : false;
    }
    return connectedList ? Sortable.getInstance(connectedList) : false;
  }

  // Public
  dispose() {
    this._listElements.forEach((obj) => {
      EventHandler.off(obj.el, 'mousedown', this._handleDragStart);
      EventHandler.off(obj.el, 'touchstart', this._handleDragStart);
    });

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  addItem(el, index, obj = {}) {
    if (typeof index !== 'number') {
      index = this._listElements.length;
    }

    const newObj = {
      id: getUID(`${CLASS_SORTABLE_ITEM}-`),
      el,
      index,
      helperInstance: null,
      handlerEl: null,
      helperEl: null,
      offsetTop: null,
      offsetLeft: null,
      translateX: 0,
      translateY: 0,
      initialDisplay: el.style.display,
      ...obj,
    };

    el.setAttribute('data-id', newObj.id);
    EventHandler.on(el, 'mousedown', this._handleDragStart);
    EventHandler.on(el, 'touchstart', this._handleDragStart);
    this._pushItemBetween(index, newObj);
  }

  // Private
  _getListElements() {
    const newArray = [];

    this._listItems.forEach((listItem, index) => {
      const newObj = {
        id: getUID(`${CLASS_SORTABLE_ITEM}-`),
        el: listItem,
        index,
        helperInstance: null,
        handlerEl: null,
        helperEl: null,
        offsetTop: listItem.offsetTop,
        offsetLeft: listItem.offsetLeft,
        translateX: 0,
        translateY: 0,
        initialDisplay: listItem.style.display,
        returnAnimation: true,
      };
      listItem.setAttribute('data-id', newObj.id);
      newArray.push(newObj);
    });

    return newArray;
  }

  _setup() {
    this._makeItemsDraggable();
  }

  _makeItemsDraggable() {
    this._listElements.forEach((obj) => {
      const options = Manipulator.getDataAttributes(obj.el);
      obj.options = options;

      if (!obj.options.disabled) {
        EventHandler.on(obj.el, 'mousedown', this._handleDragStart);
        EventHandler.on(obj.el, 'touchstart', this._handleDragStart);
      }
    });
  }

  _handleDragStart(e) {
    this._draggingObject = this._listElements.filter(
      (obj) => obj.id === e.target.getAttribute('data-id')
    )[0];

    this._setInitInfo(e);

    EventHandler.one(window, 'mousemove', this._initSortableElements);
    EventHandler.one(window, 'touchmove', this._initSortableElements);
  }

  _initSortableElements(e) {
    this._createHelper(e);
    this._createHandler();
    this._hideOriginalItem();
    this._setEvents();
  }

  _setInitInfo(e) {
    this._initialY = e.clientY - this._draggingObject.el.getBoundingClientRect().top;
    this._initialX = e.clientX - this._draggingObject.el.getBoundingClientRect().left;
  }

  _createHandler() {
    const handlerEl = this._draggingObject.el.cloneNode(true);
    const { copy } = this.options;

    const style = copy ? {} : { visibility: 'hidden' };
    Manipulator.style(handlerEl, style);

    const parentEl = this._draggingObject.el.parentNode;
    this._draggingObject.handlerEl = handlerEl;
    parentEl.insertBefore(handlerEl, this._draggingObject.el);
  }

  _createHelper(e) {
    const helperEl = this._draggingObject.el.cloneNode(true);
    const { copy } = this.options;

    helperEl.classList.add(CLASS_SORTABLE_ITEM_DRAGGING);
    const style = copy ? { opacity: '0.5' } : {};
    Manipulator.style(helperEl, style);

    EventHandler.off(helperEl, 'mousedown', this._initSortableElements);

    this._draggingObject.helperEl = helperEl;
    const helperStyles = this._getDraggingElStyle(e);

    Manipulator.style(helperEl, { ...helperStyles });
    document.body.appendChild(helperEl);

    const instance = new Draggable(helperEl);

    this._draggingObject.helperInstance = instance;
    instance._dragStart(e);
  }

  _getDraggingElStyle(e) {
    const height = this._draggingObject.el.getBoundingClientRect().height;
    const width = this._draggingObject.el.getBoundingClientRect().width;

    const shiftY = e.clientY - this._draggingObject.el.getBoundingClientRect().top;
    const shiftX = e.clientX - this._draggingObject.el.getBoundingClientRect().left;

    const top = `${e.clientY - shiftY}px`;
    const left = `${e.clientX - shiftX}px`;

    const styles = {
      width: `${width}px`,
      height: `${height}px`,
      position: 'fixed',
      top,
      left,
      display: 'flex',
    };

    return styles;
  }

  _setTranslate(el, x, y) {
    Manipulator.style(el, {
      transform: `translate3d(${x}px, ${y}px, 0px)`,
    });
  }

  _hideOriginalItem() {
    Manipulator.style(this._draggingObject.el, {
      display: 'none',
    });
    document.body.appendChild(this._draggingObject.el);
  }

  _setEvents() {
    const { sorting } = this.options;

    const inactiveSortItems = this._listElements.filter(
      (obj) => obj.id !== this._draggingObject.id
    );

    if (sorting) {
      inactiveSortItems.forEach((obj) => {
        const animateTimeExecution = this.options.animationDuration / 1000;
        Manipulator.style(obj.el, {
          transition: `transform ${animateTimeExecution}s`,
        });

        EventHandler.on(obj.el, 'mouseenter', this._handleMouseEnter);
      });
    }

    EventHandler.one(window, 'mouseup', (e) => {
      this._handleMouseUp(e, inactiveSortItems);
    });

    if (this._connectedListInstance) {
      this._setHandlersForConnectedTab();
    }
  }

  _handleMouseEnter(e) {
    EventHandler.trigger(this._draggingObject.el, EVENT_MOVE, { target: e.target });

    const elId = e.target.getAttribute('data-id');
    const enteredObj = this._listElements.filter((obj) => elId === obj.id)[0];
    const itemBelow = enteredObj.index > this._draggingObject.index;

    const itemsToMove = this._getItemsToMove(itemBelow, enteredObj);

    this._slideItems(itemBelow, itemsToMove);
    this._slideHandler(itemBelow, enteredObj, itemsToMove);

    this._draggingObject.index = enteredObj.index;

    this._setIndexes(itemsToMove, itemBelow);
  }

  _slideItems(itemBelow, itemsToMove) {
    itemsToMove.forEach((obj) => {
      const index = itemBelow ? obj.index - 1 : obj.index + 1;
      const previousObj = this._listElements[index];

      const distanceY = previousObj.offsetTop - obj.offsetTop;
      const distanceX = previousObj.offsetLeft - obj.offsetLeft;

      obj.translateY = distanceY;
      obj.translateX = distanceX;

      this._setTranslate(obj.el, distanceX, distanceY);
    });
  }

  _slideHandler() {
    let sumY = 0;
    let sumX = 0;

    this._listElements.forEach((obj) => {
      sumY -= obj.translateY;
      sumX -= obj.translateX;
    });

    this._setTranslate(this._draggingObject.handlerEl, sumX, sumY);
  }

  _getItemsToMove(itemBelow, enteredObj) {
    return this._listElements.filter((obj) => {
      if (itemBelow) {
        return this._draggingObject.index < obj.index && obj.index <= enteredObj.index;
      }

      return this._draggingObject.index > obj.index && obj.index >= enteredObj.index;
    });
  }

  _setIndexes(itemsToMove, itemBelow) {
    this._listElements = this._listElements.map((prototypeObj) => {
      itemsToMove.forEach((objToSlide) => {
        if (prototypeObj.id === objToSlide.id) {
          if (itemBelow) {
            objToSlide.index--;
          } else {
            objToSlide.index++;
          }
        }
      });

      return prototypeObj;
    });
  }

  _handleMouseUp(e, inactiveSortItems) {
    this._setTranslate(this._draggingObject.handlerEl, 0, 0);

    inactiveSortItems.forEach((obj) => {
      EventHandler.off(obj.el, 'mouseenter', this._handleMouseEnter);
      Manipulator.style(obj.el, {
        transition: 'none',
      });
      this._setTranslate(obj.el, 0, 0);
    });

    if (this._connectedListInstance) {
      EventHandler.off(
        this._connectedListInstance._element,
        'mouseover',
        this._handleMouseOverConnTab
      );
    }

    this._listElements = this._listElements.sort(this._sortIndex);

    this._rerenderList();
    this._swapElements(e);
    this._removeHelpers();
    this._setOffsets();
    this._resetTranslatesInfo();
  }

  _rerenderList() {
    this._listElements.forEach((obj) => {
      if (obj.id !== this._draggingObject.id) {
        this._element.appendChild(obj.el);
      } else {
        this._element.appendChild(this._draggingObject.handlerEl);
      }
    });
  }

  _swapElements(e) {
    const { posX, posY } = this._getPositions(e);
    this._setOriginalElPosition();
    this._startElReturnAnimation(posX, posY);
  }

  _getPositions(e) {
    const shiftY = e.clientY - this._draggingObject.handlerEl.getBoundingClientRect().top;
    const shiftX = e.clientX - this._draggingObject.handlerEl.getBoundingClientRect().left;

    const posX = shiftX - this._initialX;
    const posY = shiftY - this._initialY;

    return { posX, posY };
  }

  _setOriginalElPosition() {
    this._draggingObject.handlerEl.parentNode.insertBefore(
      this._draggingObject.el,
      this._draggingObject.handlerEl
    );
    const display = this._draggingObject.initialDisplay;
    Manipulator.style(this._draggingObject.el, { display });
  }

  _startElReturnAnimation(posX, posY) {
    this._setTranslate(this._draggingObject.el, posX, posY);

    setTimeout(() => {
      const animationBlocked = this._draggingObject.returnAnimation;
      if (animationBlocked) {
        Manipulator.style(this._draggingObject.el, {
          transition: 'transform 0.3s',
        });
      }
      this._setTranslate(this._draggingObject.el, 0, 0);
    });

    setTimeout(() => {
      Manipulator.style(this._draggingObject.el, {
        transition: 'none',
      });
    }, this.options.animationDuration);
  }

  _removeHelpers() {
    this._draggingObject.helperEl.remove();
    this._draggingObject.handlerEl.remove();
  }

  _setOffsets() {
    this._listElements.forEach((obj) => {
      obj.offsetLeft = obj.el.offsetLeft;
      obj.offsetTop = obj.el.offsetTop;
    });
  }

  _resetTranslatesInfo() {
    this._listElements.forEach((obj) => {
      obj.translateX = 0;
      obj.translateY = 0;
    });
  }

  _setHandlersForConnectedTab() {
    EventHandler.one(
      this._connectedListInstance._element,
      'mouseover',
      this._handleMouseOverConnTab
    );
  }

  _handleMouseOverConnTab(e) {
    const { copy } = this.options;
    const accessGranted = this._hasProperValue();
    const connTableEl = this._connectedListInstance._element;

    if (accessGranted) {
      EventHandler.trigger(this._draggingObject.el, EVENT_EXIT, { target: connTableEl });

      if (copy) {
        this._copyItems(e);
      } else {
        this._sendItem(e);
      }
    }
  }

  _copyItems(e) {
    const connTabInstance = this._connectedListInstance;
    const isListItem = e.target.classList.contains(CLASS_SORTABLE_ITEM);
    const isTableContainer = e.target.classList.contains(CLASS_COMPONENT);
    this._draggingObject.returnAnimation = false;

    Manipulator.style(this._draggingObject.handlerEl, {
      visibility: 'visible',
    });

    if (isListItem) {
      const enteredObj = connTabInstance._listElements.filter(
        (obj) => obj.id === e.target.getAttribute('data-id')
      )[0];

      const offsetTop = enteredObj.el.offsetTop;
      const offsetLeft = enteredObj.el.offsetLeft;

      const enteredElParent = enteredObj.el.parentNode;

      const copyEl = this._draggingObject.el.cloneNode(true);
      Manipulator.style(copyEl, { display: this._draggingObject.initialDisplay });

      enteredElParent.insertBefore(copyEl, enteredObj.el);
      connTabInstance._setOffsets();

      connTabInstance.addItem(copyEl, enteredObj.index, {
        offsetTop,
        offsetLeft,
      });

      connTabInstance._handleDragStart({ target: copyEl });

      setTimeout(() => {
        Manipulator.style(connTabInstance._draggingObject.helperEl, { display: 'none' });
        this._setElToPreview(connTabInstance._draggingObject.handlerEl);
      });
    } else if (isTableContainer) {
      const copyEl = this._draggingObject.el.cloneNode(true);
      Manipulator.style(copyEl, { display: this._draggingObject.initialDisplay });
      e.target.appendChild(copyEl);

      connTabInstance.addItem(copyEl);
      connTabInstance._handleDragStart({ target: copyEl });

      setTimeout(() => {
        Manipulator.style(connTabInstance._draggingObject.helperEl, { display: 'none' });
        this._setElToPreview(connTabInstance._draggingObject.handlerEl);
      });
    }
  }

  _setElToPreview(el) {
    Manipulator.style(el, {
      visibility: 'visible',
    });

    Manipulator.style(this._draggingObject.helperEl, {
      opacity: '0.5',
    });
  }

  _sendItem(e) {
    const connTabInstance = this._connectedListInstance;
    const isListItem = e.target.classList.contains(CLASS_SORTABLE_ITEM);
    const isTableContainer = e.target.classList.contains(CLASS_COMPONENT);
    connTabInstance._initialX = this._initialX;
    connTabInstance._initialY = this._initialY;

    if (isListItem) {
      const enteredObj = connTabInstance._listElements.filter(
        (obj) => obj.id === e.target.getAttribute('data-id')
      )[0];

      const offTop = enteredObj.el.offsetTop;
      const offLeft = enteredObj.el.offsetLeft;

      this._turnOffEvents();

      connTabInstance._draggingObject = this._draggingObject;
      connTabInstance._draggingObject.index = enteredObj.index;

      this._listElements = this._listElements.filter((obj) => obj.id !== this._draggingObject.id);
      this._resetIndexes();
      this._resetTranslates();

      connTabInstance._pushItemBetween(enteredObj.index, connTabInstance._draggingObject);
      enteredObj.el.parentNode.insertBefore(
        connTabInstance._draggingObject.handlerEl,
        enteredObj.el
      );

      this._rerenderList();

      connTabInstance._setOffsets();

      connTabInstance._draggingObject.offsetTop = offTop;
      connTabInstance._draggingObject.offsetLeft = offLeft;

      enteredObj.offsetLeft = enteredObj.el.offsetLeft;
      enteredObj.offsetTop = enteredObj.el.offsetTop;

      this._turnOnEvents();
    } else if (isTableContainer) {
      this._turnOffEvents();

      connTabInstance._draggingObject = this._draggingObject;
      connTabInstance._draggingObject.index = connTabInstance._listElements.length;

      this._listElements = this._listElements.filter((obj) => obj.id !== this._draggingObject.id);
      this._resetIndexes();
      this._resetTranslates();

      connTabInstance._listElements = [
        ...connTabInstance._listElements,
        connTabInstance._draggingObject,
      ];

      connTabInstance._element.appendChild(connTabInstance._draggingObject.handlerEl);

      connTabInstance._draggingObject.offsetTop =
        connTabInstance._draggingObject.handlerEl.offsetTop;
      connTabInstance._draggingObject.offsetLeft =
        connTabInstance._draggingObject.handlerEl.offsetLeft;

      this._turnOnEvents();
    }
  }

  _resetIndexes() {
    this._listElements.forEach((obj, index) => {
      obj.index = index;
    });
  }

  _resetTranslates() {
    this._listElements.forEach((obj) => {
      this._setTranslate(obj.el, 0, 0);
    });
  }

  _turnOffEvents() {
    EventHandler.off(this._draggingObject.el, 'mousedown', this._handleDragStart);
    EventHandler.off(this._draggingObject.el, 'touchstart', this._handleDragStart);
  }

  _turnOnEvents() {
    const draggingEl = this._connectedListInstance._draggingObject.el;
    this._connectedListInstance._setEvents();
    EventHandler.on(draggingEl, 'mousedown', this._connectedListInstance._handleDragStart);
    EventHandler.on(draggingEl, 'touchstart', this._connectedListInstance._handleDragStart);
  }

  _hasProperValue() {
    const { enterPredicate } = this.options;

    const draggingElKey = this._draggingObject.el.getAttribute('data-value');
    return enterPredicate(draggingElKey);
  }

  _pushItemBetween(index, obj) {
    this._listElements.splice(index, 0, obj);
    this._rewriteIndexes();
  }

  _rewriteIndexes() {
    this._listElements = this._listElements.map((obj, index) => {
      obj.index = index;
      return obj;
    });
  }

  _sortIndex(objOne, objTwo) {
    const indexOne = objOne.index;
    const indexTwo = objTwo.index;

    let comprasion = 0;
    if (indexOne > indexTwo) {
      comprasion = 1;
    } else if (indexOne < indexTwo) {
      comprasion = -1;
    }

    return comprasion;
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data) {
        data = new Sortable(this, _config);
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

SelectorEngine.find(SELECTOR_COMPONENT).forEach((sortableEl) => {
  let instance = Sortable.getInstance(sortableEl);
  if (!instance) {
    instance = new Sortable(sortableEl);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * */
const $ = getjQuery();
if ($) {
  const JQUERY_NO_CONFLICT = $.fn[NAME];
  $.fn[NAME] = Sortable.jQueryInterface;
  $.fn[NAME].Constructor = Sortable;
  $.fn[NAME].noConflict = () => {
    $.fn[NAME] = JQUERY_NO_CONFLICT;
    return Sortable.jQueryInterface;
  };
}

export default Sortable;