/**
* Root namespace.
* @namespace vd
*/
// #region Fixes for ReSharper (this is a workaround an can be removed hopefully one day)
// It declares some of the namespaces as global vars, so ReSharper reports no issues.
// It has no functional meaning.
globals         = typeof (globals)          === 'undefined' ? "dummy" : globals;
google          = typeof (google)           === 'undefined' ? "dummy" : google;
vd              = typeof (vd)               === 'undefined' ? "dummy" : vd;
XMLHttpRequest  = typeof (XMLHttpRequest)   === 'undefined' ? "dummy" : XMLHttpRequest;
_gaq = _gaq || [];
// #endregion Fixes for ReSharper