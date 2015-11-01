var Mocha = require('mocha')
var Runner = Mocha.Runner
var fs = require('fs')
var chalk = require('chalk')

var theme = {
  filename: chalk.blue,
  context: chalk.grey,
  lineNumber: chalk.blue,
  highlight: chalk.bold
}

var old = Runner.prototype.fail
Runner.prototype.fail = function (test, err) {
  err = decorateError(err)
  return old.call(this, test, err)
}

/*
 * Decorates an error
 */

function decorateError (err) {
  if (!err || !err.message || !err.stack) return err
  var extra = getMessage(err)
  if (extra) err.message += '\n\n' + extra
  return err
}

/*
 * Returns the extra stuff to be placed after an error message
 */

function getMessage (err) {
  var frames = err.stack.split('\n')
  for (var i = 0, len = frames.length; i < len; i++) {
    var frame = frames[i]
    var m = frame.match(/^    at (.*) \((.*):(\d+):(\d+)\)$/)
    if (!m) continue

    var fname = m[2]
    var line = m[3]
    var col = m[4]

    if (fname.match(/node_modules/)) continue

    return readFromFile(fname, line, col)
  }
}

/*
 * Reads the code from a file `fname` around line `line`
 */

function readFromFile (fname, line, col) {
  line = +line
  var file = fs.readFileSync(fname, 'utf-8')
  var lines = file.split('\n')
  var context = 2
  var alpha = Math.max(line - context, 0)
  var omega = Math.min(line + context - 1, lines.length - 1)
  var result = []
  var indent = '      '

  // Add filename
  var relativeFname = fname.replace(process.cwd(), '').replace(/^\//, '')
  result.push(indent + theme.filename(relativeFname))

  for (var i = alpha; i < omega; i++) {
    var color = i === (line - 1) ? theme.highlight : theme.context
    var ln = '' + (i + 1)
    ln = Array((omega + 1).toString().length - ln.length).join(' ') + ln
    result.push(indent + theme.lineNumber(ln) + '  ' + color(lines[i]))
  }
  result.push(indent + '  ' + Array(+col + ln.length).join(' ') + '^')

  return result.join('\n')
}

