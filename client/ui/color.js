const colors = Object.create(null)
colors.data = Object.create(null)

const hsl = (h, s, l, key) => {
  colors[key] = {
    h, s, l,
    hsl: `hsl(${h},${s}%,${l}%)`,
    alpha: a => `hsla(${h},${s}%,${l}%,${a})`,
  }
}

hsl(0,   0,   0,  'black')
hsl(0,   0,   100,'white')
hsl(231, 15,  18, 'background')
hsl(232, 14,  31, 'selected')
hsl(60,  30,  96, 'foreground')
hsl(225, 27,  51, 'comment')
hsl(191, 97,  77, 'cyan')
hsl(135, 94,  65, 'green')
hsl(31,  100, 71, 'orange')
hsl(326, 100, 74, 'pink')
hsl(265, 89,  78, 'purple')
hsl(0,   100, 67, 'red')
hsl(65,  92,  76, 'yellow')

module.exports = colors
