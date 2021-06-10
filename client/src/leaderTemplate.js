(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['leader'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"lboard_mem\">\n<<<<<<< Updated upstream\n   <div class=\"name_bar\">\n      <p><span></span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":4,"column":22},"end":{"line":4,"column":30}}}) : helper)))
    + "</p>\n      <div class=\"bar_wrap\">\n         <div class=\"inner_bar\" style=\"width: 95%\"></div>\n      </div>\n   </div>\n   <div class=\"points\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"score") || (depth0 != null ? lookupProperty(depth0,"score") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"score","hash":{},"data":data,"loc":{"start":{"line":9,"column":23},"end":{"line":9,"column":32}}}) : helper)))
    + "</div>\n</div>\n=======\n  <div class=\"name_bar\">\n    <p><span></span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":13,"column":20},"end":{"line":13,"column":28}}}) : helper)))
    + "</p>\n    <div class=\"bar_wrap\">\n      <div class=\"inner_bar\" style=\"width: 95%\"></div>\n    </div>\n  </div>\n  <div class=\"points\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"score") || (depth0 != null ? lookupProperty(depth0,"score") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"score","hash":{},"data":data,"loc":{"start":{"line":18,"column":22},"end":{"line":18,"column":31}}}) : helper)))
    + "</div>\n</div>\n>>>>>>> Stashed changes\n";
},"useData":true});
})();