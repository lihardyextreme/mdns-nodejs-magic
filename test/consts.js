const Const = require('../lib/const')
for(let c in Const)
  Const.TYPE_NAMES[Const[c]] && console.log(c,Const[c],Const.TYPE_NAMES[Const[c]])
