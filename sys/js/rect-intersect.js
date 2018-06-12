function edgeTest (p1, p2, p3, r2) {
    var rot = [ -(p2[1] - p1[1]),
                  p2[0] - p1[0] ];

    var ref = (rot[0] * (p3[0] - p1[0]) +
               rot[1] * (p3[1] - p1[1])) >= 0;

    for (var i = 0, il = r2.length; i < il; i+=2) {
        if (((rot[0] * (r2[i]   - p1[0]) +
              rot[1] * (r2[i+1] - p1[1])) >= 0) === ref) return false;
    }

    return true;

}


// both rects must be specified as all four points in plain vector, like: 
//   [ x1, y1, x2, y2, x3, y3, x4, y4 ], clockwise from top-left point
// their points must already be rotated and specified in global space before passing to this function
function isecRects (r1, r2) {
    if (!r1 || !r2) throw new Error('Rects are not accessible');

    var pn, px;
    for (var pi = 0, pl = r1.length; pi < pl; pi += 2) {
        pn = (pi === (pl - 2)) ? 0 : pi + 2; // next point
        px = (pn === (pl - 2)) ? 0 : pn + 2;
        if (edgeTest([r1[pi], r1[pi+1]],
                     [r1[pn], r1[pn+1]],
                     [r1[px], r1[px+1]], r2)) return false;
    }
    for (var pi = 0, pl = r2.length; pi < pl; pi += 2) {
        pn = (pi === (pl - 2)) ? 0 : pi + 2; // next point
        px = (pn === (pl - 2)) ? 0 : pn + 2;
        if (edgeTest([r2[pi], r2[pi+1]],
                     [r2[pn], r2[pn+1]],
                     [r2[px], r2[px+1]], r1)) return false;
    }
    return true;
}

// both rects must be specified as all four points in plain vector, like: 
//   [ x1, y1, x2, y2, x3, y3, x4, y4 ], clockwise from top-left point
// their points must already be rotated and specified in global space before passing to this function
function testCol (r1) {
    for (var i in m.colliders) {
        var c = m.colliders[i],
            t = isecRects(r1, [
                c.start.x,
                c.start.y,
                c.end.x,
                c.end.y
            ])
      if (t) return t
    }
    return false
}