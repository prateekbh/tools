/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   lib/mixins/dir-mixin.js
 */


/**
 * Element class mixin that allows elements to use the `:dir` CSS Selector to
 * have text direction specific styling.
 *
 * With this mixin, any stylesheet provided in the template will transform
 * `:dir` into `:host([dir])` and sync direction with the page via the
 * element's `dir` attribute.
 *
 * Elements can opt out of the global page text direction by setting the `dir`
 * attribute directly in `ready()` or in HTML.
 *
 * Caveats:
 * - Applications must set `<html dir="ltr">` or `<html dir="rtl">` to sync
 *   direction
 * - Automatic left-to-right or right-to-left styling is sync'd with the
 *   `<html>` element only.
 * - Changing `dir` at runtime is supported.
 * - Opting out of the global direction styling is permanent
 */
declare function DirMixin<T extends new (...args: any[]) => {}>(base: T): T & DirMixinConstructor & PropertyAccessorsConstructor & PropertiesChangedConstructor;

interface DirMixinConstructor {
  new(...args: any[]): DirMixin;
  _processStyleText(cssText: any, baseURI: any): any;

  /**
   * Replace `:dir` in the given CSS text
   *
   * @param text CSS text to replace DIR
   * @returns Modified CSS
   */
  _replaceDirInCssText(text: string): string;
}

interface DirMixin {
  ready(): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
}
