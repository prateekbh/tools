/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   lib/utils/resolve-url.html
 */

/// <reference path="boot.d.ts" />

declare namespace Polymer {

  /**
   * Module with utilities for resolving relative URL's.
   */
  namespace ResolveUrl {


    /**
     * Resolves the given URL against the provided `baseUri'.
     */
    function resolveUrl(url: string, baseURI?: string|null): string;


    /**
     * Resolves any relative URL's in the given CSS text against the provided
     * `ownerDocument`'s `baseURI`.
     */
    function resolveCss(cssText: string, baseURI: string): string;


    /**
     * Returns a path from a given `url`. The path includes the trailing
     * `/` from the url.
     */
    function pathFromUrl(url: string): string;
  }
}
