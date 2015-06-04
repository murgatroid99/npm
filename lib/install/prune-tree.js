'use strict'
var validate = require('aproba')
var flattenTree = require('./flatten-tree.js')

function isNotPackage (mod) {
  return function (parentMod) { return mod !== parentMod }
}

function isChildOfTop (tree) {
  return (tree.package._requiredBy || []).filter(function (reqBy) {
    return reqBy === '/'
  }).length > 0
}

module.exports = function pruneTree (tree) {
  validate('O', arguments)
  var flat = flattenTree(tree)
  // we just do this repeatedly until there are no more orphaned packages
  // which isn't as effecient as it could be on a REALLY big tree
  // but we'll face that if it proves to be an issue
  var removedPackage
  do {
    removedPackage = false
    Object.keys(flat).forEach(function (flatname) {
      var child = flat[flatname]
      if (!child.parent) return
      child.package._requiredBy = (child.package._requiredBy || []).filter(function (req) {
        var isDev = req.substr(0,4) === '#DEV'
        if (req[0] === '#' && !isDev) return true
        if (flat[req]) return true
        if (!isDev) return false
        var devDep = flat[req.substr[5]]
        return devDep && isChildOfTop(devDep)
      })
      if (!child.package._requiredBy.length) {
        removedPackage = true
        delete flat[flatname]
        child.parent.children = child.parent.children.filter(isNotPackage(child))
      }
    })
  } while (removedPackage)
}
