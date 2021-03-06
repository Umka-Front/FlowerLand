const create = {
  textarea: () => {
    return '<textarea class="wysiwyg-textarea"></textarea>';
  },
  contentDiv: () => {
    return '<div class="wysiwyg-content" contenteditable="true"></div>';
  },
  toolBar: (options) => {
    const {
      wysiwygTranslations,
      wysiwygColors,
      wysiwygStylesSection,
      wysiwygFormattingSection,
      wysiwygJustifySection,
      wysiwygListsSection,
      wysiwygLinksSection,
      wysiwygShowCodeSection,
      wysiwygUndoRedoSection,
      wysiwygFixed,
      wysiwygFixedOffsetTop,
    } = options;
    const translation = wysiwygTranslations;

    return `<div class="wysiwyg-toolbar btn-toolbar ${
      wysiwygFixed ? 'sticky-top' : ''
    }" style="top: ${wysiwygFixedOffsetTop}px" role="toolbar" aria-label="Toolbar with button groups">
      ${wysiwygStylesSection ? create.stylesSection(translation) : ''}
      ${wysiwygFormattingSection ? create.formattingSection(translation, wysiwygColors) : ''}
      ${wysiwygJustifySection ? create.justifySection(translation) : ''}
      ${wysiwygListsSection ? create.listsSection(translation) : ''}
      ${wysiwygLinksSection ? create.linksSection(translation) : ''}
      ${wysiwygShowCodeSection ? create.showCodeSection(translation) : ''}
      ${wysiwygUndoRedoSection ? create.undoRedoSection(translation) : ''}
    </div>`;
  },
  stylesSection: (translations) => {
    const { textStyle, paragraph, heading, preformatted } = translations;
    return `
      <div class="wysiwyg-toolbar-group">
        <div class="mx-1 dropdown">
          <button
            class="btn btn-sm btn-light wysiwyg-btn dropdown-toggle shadow-0"
            type="button"
            data-toggle="dropdown"
            aria-expanded="false"
          >
            ${textStyle}
          </button>
          <ul class="wysiwyg-toolbar-options-list dropdown-menu" aria-labelledby="dropdownMenuButton">
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="p">${paragraph}</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h1">${heading} 1</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h2">${heading} 2</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h3">${heading} 3</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h4">${heading} 4</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h5">${heading} 5</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="h6">${heading} 6</a></li>
            <li><a class="dropdown-item" href="#!" data-cmd="formatBlock" data-arg="pre">${preformatted}</a></li>
          </ul>
        </div>
      </div>
    `;
  },
  formattingSection: (translations, colors) => {
    const { bold, italic, underline, strikethrough, textcolor, textBackgroundColor } = translations;
    return `
      <div class="wysiwyg-toolbar-group">
        <div class="mx-1 btn-group btn-group-sm shadow-0" role="group">
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="bold" title="${bold}"><i class="fas fa-bold"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="italic" title="${italic}"><i class="fas fa-italic"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="underline" title="${underline}"><i class="fas fa-underline"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="strikethrough" title="${strikethrough}"><i class="fas fa-strikethrough"></i></button>
          <div data-tooltip="tooltip" data-placement="bottom" title="${textcolor}" class="btn-group btn-group-sm" role="group">
            <button class="dropdown-toggle btn btn-light wysiwyg-btn" data-toggle="dropdown" aria-expanded="false"><i class="fas fa-font"></i></button>
            <div class="dropdown-menu">
              ${create.textColorPalette(colors, 'foreColor')}
            </div>
          </div>
          <div data-tooltip="tooltip" data-placement="bottom" title="${textBackgroundColor}" class="btn-group btn-group-sm" role="group">
            <button class="dropdown-toggle btn btn-light wysiwyg-btn" data-toggle="dropdown" aria-expanded="false"><i class="fas fa-paint-brush"></i></button>
            <div class="dropdown-menu">
              ${create.textColorPalette(colors, 'backColor')}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  textColorPalette: (colors, cmd) => {
    let result = '';

    colors.forEach((color) => {
      result += `<button type="button" class="btn btn-link wysiwyg-color" data-ripple-color="dark" data-cmd=${cmd} data-arg="${color}" style="background: ${color};"></button>`;
    });

    return result;
  },
  justifySection: (translations) => {
    const { alignCenter, alignLeft, alignRight, alignJustify } = translations;
    return `
      <div class="wysiwyg-toolbar-group">
        <div class="mx-1 btn-group btn-group-sm shadow-0" role="group">
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="justifyleft" title="${alignLeft}"><i class="fas fa-align-left"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="justifycenter" title="${alignCenter}"><i class="fas fa-align-center"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="justifyright" title="${alignRight}"><i class="fas fa-align-right"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="justifyfull" title="${alignJustify}"><i class="fas fa-align-justify"></i></button>
        </div>
      </div>
    `;
  },
  listsSection: (translations) => {
    const { unorderedList, orderedList, decreaseIndent, increaseIndent } = translations;
    return `
      <div class="wysiwyg-toolbar-group">
        <div class="mx-1 btn-group btn-group-sm shadow-0" role="group">
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="insertUnorderedList" title="${unorderedList}"><i class="fas fa-list-ul"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="insertOrderedList" title="${orderedList}"><i class="fas fa-list-ol"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="outdent" title="${decreaseIndent}"><i class="fas fa-outdent"></i></button>
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="indent" title="${increaseIndent}"><i class="fas fa-indent"></i></button>
        </div>
      </div>
    `;
  },
  linksSection: (translations) => {
    const {
      insertLink,
      addLinkHead,
      linkUrlLabel,
      linkDescription,
      okButton,
      cancelButton,
      insertPicture,
      addImageHead,
      imageUrlLabel,
      insertHorizontalRule,
    } = translations;
    return `
      <div class=" wysiwyg-toolbar-group">
        <div id="links-section" class="mx-1 btn-group btn-group-sm shadow-0 dropdown" role="group">
          <div data-tooltip="tooltip" data-placement="bottom" title="${insertLink}" class="btn-group btn-group-sm" role="group">
            <button class="dropdown-toggle btn btn-light wysiwyg-btn" data-display="static" data-toggle="dropdown" aria-expanded="false"><i class="fas fa-paperclip"></i></button>
            <div class="dropdown-menu dropdown-menu-sm-right" style="min-width: 25vw;">
              <form class="px-4 py-3">
                <h5 class="mb-3">${addLinkHead}</h5>
                <div class="form-outline mb-4">
                  <input type="url" class="form-control" />
                  <label class="form-label" for="link-url">${linkUrlLabel}</label>
                </div>
                <div class="form-outline mb-4">
                  <input type="text" class="form-control" />
                  <label class="form-label" for="link-description">${linkDescription}</label>
                </div>                  
                <div class="d-flex justify-content-end">
                  <button type="button" data-cmd="insertlink" class="btn btn-primary">${okButton}</button>
                  <button type="button" data-cmd="close-dropdown" class="btn btn-primary ml-2">${cancelButton}</button>
                </div>
              </form>
            </div>
          </div>
          <div data-tooltip="tooltip" data-placement="bottom" title="${insertPicture}" class="btn-group btn-group-sm" role="group">
            <button class="dropdown-toggle btn btn-light wysiwyg-btn" data-display="static" data-toggle="dropdown"><i class="far fa-image"></i></button>
            <div class="dropdown-menu dropdown-menu-sm-right" style="min-width: 25vw;">
              <form class="px-4 py-3">
                <h5 class="mb-3">${addImageHead}</h5>
                <div class="form-outline mb-4">
                  <input type="url" class="form-control" />
                  <label class="form-label" for="image-url">${imageUrlLabel}</label>
                </div>              
                <div class="d-flex justify-content-end">
                  <button type="button" data-cmd="insertpicture" class="btn btn-primary">${okButton}</button>
                  <button type="button" data-cmd="close-dropdown" class="btn btn-primary ml-2">${cancelButton}</button>
                </div>
              </form>
            </div>
          </div>
          <button data-tooltip="tooltip" data-placement="bottom" class="btn btn-light wysiwyg-btn" data-cmd="insertHorizontalRule" title="${insertHorizontalRule}"><i class="fas fa-grip-lines"></i></button>
        </div>
      </div>
    `;
  },
  showCodeSection: (translations) => {
    return `
      <div class="ml-auto wysiwyg-toolbar-group">
        <div class="btn-group mx-1 btn-group-sm shadow-0" role="group">
          <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-sm btn-light wysiwyg-btn shadow-0" data-cmd="toggleHTML" title="${translations.showHTML}"><i class="fas fa-code"></i></button>
        </div>
      </div>
    `;
  },
  undoRedoSection: (translations) => {
    const { undo, redo } = translations;
    return `
    <div class="wysiwyg-toolbar-group">
      <div class="btn-group mx-1 btn-group-sm shadow-0" role="group">
        <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="undo" title="${undo}"><i class="fas fa-angle-left"></i></button>
        <button data-tooltip="tooltip" data-placement="bottom" type="button" class="btn btn-light wysiwyg-btn" data-cmd="redo" title="${redo}"><i class="fas fa-angle-right"></i></button>
      </div>
    </div>
  `;
  },
  toolbarToggler: (translations) => {
    return `
    <div class="ml-auto wysiwyg-toolbar-group wysiwyg-toolbar-toggler">
      <div data-tooltip="tooltip" data-placement="bottom" title="${translations.moreOptions}" class="mx-1 dropdown">
        <button class="dropdown-toggle btn btn-sm btn-light wysiwyg-btn shadow-0" data-display="static" data-toggle="dropdown" data-dropdown-animation="off"><i class="fas fa-ellipsis-h"></i></button>
        <div class="dropdown-menu dropdown-menu-right">
          
        </div>
      </div>
    </div>
  `;
  },
};

export default create;
