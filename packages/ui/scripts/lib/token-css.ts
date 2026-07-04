/*
 * CSS-token parsing delegation for the `@pumni/ui` build scripts.
 * Re-exports variables and resolvers from the unified token-resolver module.
 */

export {
  uiRoot,
  css,
  type Mode,
  readVariables,
  buildTokenMap,
  resolveLiteral,
  resolveOklch,
  splitTopLevelCommas,
} from './token-resolver';
