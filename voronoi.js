// Google closure library data structures
// Standard hash map with O(1) operations, priority queue with O(log n) operations,
// AVL tree as a BBST with O(log n) operations.
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.structs.PriorityQueue");
goog.require("goog.structs.AvlTree");

// Constants for event types
var SITE = 1;
var ARC = 2;

VoronoiSystem = function (thecanvas) {
  var points = [];
  var w = thecanvas.height();
  var h = thecanvas.width();
  var maxx = Number.NEGATIVE_INFINITY;
  var maxy = Number.NEGATIVE_INFINITY;
  var minx = Number.POSITIVE_INFINITY;
  var miny = Number.POSITIVE_INFINITY;
  var diagram = null;
  var bounds = [0, 0, 1, 1];
  var pert = true;

  var that = {
    reset: function() {
      points = [];
    },
    setPerturbation: function (p) {
      pert = p;
    },
    addHandlers: function () {
      thecanvas.click(function (e) {
        var x = e.pageX - thecanvas.position().left - 5;
        var y = e.pageY - thecanvas.position().top - 5;
        that.addPoint(x, y);
        that.update();
        that.complete();
      });
    },
    addPoint: function (x, y) {
      x = Math.floor(x);
      y = Math.floor(y);

      if (pert) {
        if (points.filter(p => p.x === x).length > 0) {
          return that.addPoint(x + Math.sign(Math.random() - 0.5), y);
        }
        if (points.filter(p => p.y === y).length > 0) {
          return that.addPoint(x, y + Math.sign(Math.random() - 0.5));
        }
      }
      points.push({x: x, y: y});

      if (x > maxx)
        maxx = x;
      if (y > maxy)
        maxy = y;
      if (x < minx)
        minx = x;
      if (y < miny)
        miny = y;
      diagram = null;
    },
    addPoints: function (pts) {
      for (let pt of pts) {
        that.addPoint(pt.x, pt.y);
      }
      that.update();
      that.complete();
    },
    bounds: function (b) {
      if (!b)
        return bounds;
      for (var i = 0; i < 4; ++i)
        bounds[i] = parseInt(b[i]);
      return bounds;
    },
    fitBounds: function () {
      if (maxx === minx) {
        bounds[0] = points[0].x - 1;
        bounds[2] = points[0].x + 1;
      }
      if (maxy === miny) {
        bounds[1] = points[0].y - 1;
        bounds[3] = points[0].y + 1;
      } else if ((maxx - minx) / (maxy - miny) < 1) {
        var expected = maxy - miny;
        var diff = expected - (maxx - minx);
        bounds = [minx - diff / 2, miny, maxx + diff / 2, maxy];
      } else if ((maxx - minx) / (maxy - miny) > 1) {
        var expected = maxx - minx;
        var diff = expected - (maxy - miny);
        bounds = [minx, miny - diff / 2, maxx, maxy + diff / 2];
      } else {
        bounds[0] = minx;
        bounds[1] = miny;
        bounds[2] = maxx;
        bounds[3] = maxy;
      }
      bounds[0] -= 0.1 * (bounds[2] - bounds[0]);
      bounds[1] -= 0.1 * (bounds[3] - bounds[1]);
      bounds[2] += 0.1 * (bounds[2] - bounds[0]);
      bounds[3] += 0.1 * (bounds[3] - bounds[1]);
    },
    update: function () {
      thecanvas.find(".point").remove();
      
      // Draw points
      for (var i = 0; i < points.length; ++i) {
        $(document.createElement("div")).addClass("point").css({left: points[i].x - 1, top: points[i].y - 1}).attr({id: "point-" + i}).appendTo($("#map"));
      }

      // Draw Voronoi Diagram
      if (!diagram)
        return;
      var ret = diagram.draw(that);

      // Update slider position
      return ret;
    },
    // DRAW FUNCTIONS
    lineDistance(x, y, x0, y0) {
      return Math.sqrt((x -= x0) * x + (y -= y0) * y);
    },
    drawLine(a, b, line) {
      var pointA = $(a).offset();
      var pointB = $(b).offset();
      var pointAcenterX = $(a).width() / 2;
      var pointAcenterY = $(a).height() / 2;
      var pointBcenterX = $(b).width() / 2;
      var pointBcenterY = $(b).height() / 2;
      var angle = Math.atan2(pointB.top - pointA.top, pointB.left - pointA.left) * 180 / Math.PI;
      var distance = that.lineDistance(pointA.left, pointA.top, pointB.left, pointB.top);

      // Set Angle
      $(line).css('transform', 'rotate(' + angle + 'deg)');

      // Set Width
      $(line).css('width', distance + 'px');

      // Set Position
      $(line).css('position', 'absolute');
      //console.log(pointA, pointB, pointAcenterY, pointBcenterY);
      if (pointB.left < pointA.left) {
        $(line).offset({left: pointB.left + pointBcenterX});
      } else {
        $(line).offset({left: pointA.left + pointAcenterX});
      }
      if (pointB.top < pointA.top) {
        $(line).offset({top: pointB.top + pointBcenterY});
      } else {
        $(line).offset({top: pointA.top + pointAcenterY});
      }
    },
    drawEdge: function (e) {
      var p1 = e.p1;
      var p2 = e.p2;

      if ((p1.x < 0 && p2.x < 0) || (p1.y < 0 && p2.y < 0) || (p1.x > w && p2.x > w) || (p1.y > h && p2.y > h)) {
        return;
      }
      // Keep edges mostly in bounds, since browsers render large negative
      // coordinates incorrectly
      if (p1.x < 0) {
        p1 = intersection(p1, p2, {x: 0, y: 0}, {x: 0, y: h});
      }
      if (p1.y < 0) {
        p1 = intersection(p1, p2, {x: 0, y: 0}, {x: w, y: 0});
      }
      if (p2.x < 0) {
        p2 = intersection(p1, p2, {x: 0, y: 0}, {x: 0, y: h});
      }
      if (p2.y < 0) {
        p2 = intersection(p1, p2, {x: 0, y: 0}, {x: w, y: 0});
      }


      if (p1.x > w) {
        p1 = intersection(p1, p2, {x: w, y: 0}, {x: w, y: h});
      }
      if (p1.y > h) {
        p1 = intersection(p1, p2, {x: 0, y: h}, {x: w, y: h});
      }
      if (p2.x > w) {
        p2 = intersection(p1, p2, {x: w, y: 0}, {x: w, y: h});
      }
      if (p2.y > h) {
        p2 = intersection(p1, p2, {x: 0, y: h}, {x: w, y: h});
      }

      let n = thecanvas.find(".line").length;
      $(document.createElement("div")).addClass("point tmp start").css({left: p1.x, top: p1.y}).appendTo(thecanvas);
      $(document.createElement("div")).addClass("point tmp end").css({left: p2.x, top: p2.y}).appendTo(thecanvas);
      $(document.createElement("div")).addClass("line line-" + n).data({debug: [p1, p2]}).appendTo(thecanvas);
      that.drawLine(".tmp.start", ".tmp.end", ".line-" + n);
      thecanvas.find(".tmp").remove();
    },
    step: function () {
      if (!diagram)
        diagram = new Voronoi(points);
      if (diagram.step()) {
        that.update();
      } else {
        diagram.finish(that);
        that.update();
      }
    },
    complete: function () {
      that.fitBounds();
      if (!diagram)
        diagram = new Voronoi(points);
      diagram.compute();
      diagram.finish(that);
      that.update();
    }
  };
  return that;
};

Voronoi = function (points) {
  var pt, ev;

  // Sweep line event queue
  var pq = new goog.structs.PriorityQueue();

  // An event is of two types: SITE or ARC
  // Events have an event coordinate x, either a point (for a SITE)
  // or an arc (for an ARC), a type, and whether or not it is valid.
  //     SITE object: x,y
  //     ARC object: p is the coordinates (x,y) of the point
  //                d is the index into beach of the arc
  //                next, prev have next and previous pointers
  //                edge indexes into the edge array for the upper edge of the arc
  //                key is a static key that is used for the qmap hash table

  // A sorted structure containing the beach line
  // The indices are managed manually due to the difficulty in computing the
  // nearest parabolic arc
  // Thus we use this as a linked-list-sorted-array hybrid structure with
  // real-valued indices
  var beach = new goog.structs.AvlTree(function (a, b) {
    return a.d - b.d;
  });

  // A map of arcs to events, for easy event invalidation
  var qmap = new goog.structs.Map;

  // A list of edges {vertices:[v1,v2],points:[p1,p2]};
  // Vertices are the endpoints of the edge; points are the diagram points that
  // this edge bisects
  var edges = [];

  // Initialize event queue
  for (let pt of points) {
    var evt = {
      ox: pt.x,
      oy: pt.y,
      x: pt.x,
      y: pt.y,
      p: pt,
      type: SITE, 
      valid: true
    };
    pq.enqueue(pt.x, evt);
  }

  // Current sweep line location
  var currx = pq.isEmpty() ? 0 : pq.peek().x;

  var that = {
    // Calculates the static key for arc
    arcKey: function (arc) {
      var tmp = {i: arc.p, n: arc.next ? arc.next.p : arc.next, p: arc.prev ? arc.prev.p : arc.prev};
      // Closure hash map uses the toString function to get the key, so
      // calculate as a json string on the coordinates of the three arc centers
      tmp.toString = function () {
        return JSON.stringify(tmp);
      };
      return tmp;
    },
    // Adds the arc event to the appropriate lists
    addEvent: function (arc) {
      if (!arc.prev || !arc.next)
        return;
      // If the site is in front of both of its neighbors, then it can't
      // be "hidden", i.e. this is an expanding arc
      if (arc.p.x > arc.prev.p.x && arc.p.x > arc.next.p.x)
        return;
      var ccenter = circumcenter(arc.p, arc.prev.p, arc.next.p);
      // If sites are collinear, then the edges cannot intersect
      if (!ccenter)
        return;
      var cradius = circumradius(arc.p, arc.prev.p, arc.next.p);
      var x = ccenter.x + cradius;
      // If this event has passed, it is invalid
      if (x < currx)
        return;
      // Otherwise, add the event to the queue
      var evt = {x: x, arc: arc, v: ccenter, type: ARC, valid: true};
      qmap.set(arc.key, evt);
      pq.enqueue(evt.x, evt);
    },
    // Determines whether this arc event actually consists of
    // three parabolic arcs intersecting at the same point.
    // There's probably a calculation that can determine this before adding
    // the event to the queue, but this constant time calculation suffices
    isValidArcEvent: function (arc) {
      var ccenter = circumcenter(arc.p, arc.prev.p, arc.next.p);
      if (!ccenter) {
        return false;
      }
      var ul = tangentCircle(arc.p, arc.next.p, currx);
      var ll = tangentCircle(arc.prev.p, arc.p, currx);
      if (dist2(ul, ll) < EPS) {
        return true;
      }
      return false;
    },

    // Perform a binary search by walking down the AVL tree
    searchBeach: function (x, y) {
      var curr = beach.root_;
      while (true) {
        // A "break point", i.e. an intersection of two arcs, is
        // equidistant from the two center points and the sweep line.
        // Therefore, we just calculate the center of a circle
        // passing through the two points and tangent to the line
        var ul = Number.POSITIVE_INFINITY;
        var ll = Number.NEGATIVE_INFINITY;
        if (curr.value.next) {
          ul = tangentCircle(curr.value.p, curr.value.next.p, x).y;
        }
        if (curr.value.prev) {
          ll = tangentCircle(curr.value.prev.p, curr.value.p, x).y;
        }
        if (y < ll && curr.left) {
          curr = curr.left;
        } else if (y > ul && curr.right) {
          curr = curr.right;
        } else {
          return curr.value;
        }
      }
    },

    // Main loop: Process a single event off of the event queue
    step: function () {
      if (!pq.isEmpty()) {
        // Get a valid event
        var nextev = false;
        do {
          nextev = pq.dequeue();
        } while (!pq.isEmpty() && !nextev.valid);
        if (pq.isEmpty() && !nextev)
          return false;

        ev = nextev;
        currx = ev.x;
        pt = ev.p;

        if (ev.type === SITE) {
          // Initial point
          if (beach.getCount() === 0) {
            beach.add({p: pt, d: 0, next: null, prev: null, edge: -1});
            return true;
          }
          // Search beach for arc with same y-coord
          var intersect = that.searchBeach(pt.x, pt.y);
          var d = intersect.d;

          // Remove intersected arc
          beach.remove(intersect);

          // Insert two new subarcs plus the newly constructed arc
          //      Get adjacent arcs
          var next = intersect.next;
          var prev = intersect.prev;
          //      Calculate indices into AVL tree
          var nextd, prevd;
          if (next)
            nextd = (d + next.d) / 2;
          else if (prev)
            nextd = prev.d + 2 * (d - prev.d);
          else
            nextd = 4096;
          if (prev)
            prevd = (d + prev.d) / 2;
          else if (next)
            prevd = next.d - 2 * (next.d - d);
          else
            prevd = -4096;
          var index = edges.length;
          //      Create arc objects
          var lowarc =
            {p: intersect.p, d: prevd, prev: intersect.prev, edge: index};
          var uparc =
            {p: intersect.p, d: nextd, next: intersect.next, edge: intersect.edge};
          var newarc = {p: pt, d: d, next: uparc, prev: lowarc, edge: index};
          lowarc.next = newarc;
          uparc.prev = newarc;
          if (intersect.prev)
            intersect.prev.next = lowarc;
          if (intersect.next)
            intersect.next.prev = uparc;
          newarc.key = that.arcKey(newarc);
          lowarc.key = that.arcKey(lowarc);
          uparc.key = that.arcKey(uparc);
          edges.push({vertices: [], points: [pt, intersect.p], uparc: newarc});
          beach.add(newarc);
          beach.add(lowarc);
          beach.add(uparc);

          // Invalidate ARC event containing old arc
          var delev = qmap.get(intersect.key);
          if (delev)
            delev.valid = false;

          // Add two new ARC events
          that.addEvent(uparc);
          that.addEvent(lowarc);
        } else if (ev.type === ARC) {
          if (!that.isValidArcEvent(ev.arc)) {
            return true;
          }
          // Record edge information
          var point = circumcenter(ev.arc.p, ev.arc.prev.p, ev.arc.next.p);
          edges[ev.arc.prev.edge].vertices.push(point);
          edges[ev.arc.edge].vertices.push(point);
          // Update edges
          var index = edges.length;
          edges.push({vertices: [point], points: [ev.arc.prev.p, ev.arc.next.p]});
          ev.arc.prev.edge = index;

          // Delete the arc that disappeared
          beach.remove(ev.arc);
          // Invalidate 3 ARC events with old arc, and add new events
          if (ev.arc.prev) {
            var delev = qmap.get(ev.arc.prev.key);
            if (delev)
              delev.valid = false;
            ev.arc.prev.next = ev.arc.next;
            that.addEvent(ev.arc.prev);
          }
          if (ev.arc.next) {
            var delev = qmap.get(ev.arc.next.key);
            if (delev)
              delev.valid = false;
            ev.arc.next.prev = ev.arc.prev;
            that.addEvent(ev.arc.next);
          }
          var delev = qmap.get(ev.arc.key);
          if (delev)
            delev.valid = false;
        }
        return true;
      }
      return false;
    },
    // Step through entire queue
    compute: function () {
      while (!pq.isEmpty()) {
        that.step();
      }
    },
    // Advance sweep line to draw unbounded edges
    finish: function (draw) {
      var bbox = draw.bounds();
      var inc = bbox[2] - bbox[0];
      while (that.draw(draw)) {
        that.moveline(currx + inc);
        inc *= 2;
      }
    },
    moveline: function (x) {
      if (ev && x < ev.x)
        return false;
      while (!pq.isEmpty() && x > pq.peek().x) {
        if (pq.peek().valid)
          that.step();
        else
          pq.dequeue();
      }
      currx = x;
      return true;
    },
    arcInView: function (bbox, p, x) {
      if (x < bbox[2])
        return true;
      var corners = [{x: bbox[2], y: bbox[1]}, {x: bbox[2], y: bbox[3]}];
      var in1 = (dist(corners[0], p) > Math.abs(corners[0].x - x));
      var in2 = (dist(corners[1], p) > Math.abs(corners[1].x - x));
      return (in1 || in2);
    },
    drawBeach: function (draw) {
      var bbox = draw.bounds();
      if (beach.getCount() === 0)
        return true;
      else if (beach.getCount() === 1) {
        var c = beach.getMinimum();
        while (c.next && c.p.x === currx) {
          c = c.next;
        }
        var dx = currx - bbox[0];
        var dx2 = c.p.x - bbox[0];
        var yy = Math.sqrt(dx * dx - dx2 * dx2);
        var ul = {x: bbox[0], y: c.p.y + yy};
        var ll = {x: bbox[0], y: c.p.y - yy};
        //draw.drawArc(c.p, currx, ul, ll);
        return that.arcInView(bbox, c.p, currx);
      }
      var beachExists = false;
      var curr = beach.getMinimum();
      var ul = tangentCircle(curr.p, curr.next.p, currx);
      var dx = currx - bbox[0];
      var dx2 = curr.p.x - bbox[0];
      var yy = Math.sqrt(dx * dx - dx2 * dx2);
      var ll = {x: bbox[0], y: curr.p.y - yy};
      //draw.drawArc(curr.p, currx, ul, ll);
      beachExists = beachExists || that.arcInView(bbox, curr.p, currx);
      for (curr = curr.next; curr.next; curr = curr.next) {
        ul = tangentCircle(curr.p, curr.next.p, currx);
        ll = tangentCircle(curr.prev.p, curr.p, currx);
        //draw.drawArc(curr.p, currx, ul, ll);
        beachExists = beachExists || that.arcInView(bbox, curr.p, currx);
      }
      dx = currx - bbox[0];
      dx2 = curr.p.x - bbox[0];
      yy = Math.sqrt(dx * dx - dx2 * dx2);
      ul = {x: bbox[0], y: curr.p.y + yy};
      ll = tangentCircle(curr.prev.p, curr.p, currx);
      //draw.drawArc(curr.p, currx, ul, ll);
      beachExists = beachExists || that.arcInView(bbox, curr.p, currx);
      return beachExists;
    },
    draw: function (draw) {
      var ret = that.drawBeach(draw);
      $("#map").find(".line").remove();

      if (beach.getCount() < 2)
        return ret;
      // Keep track of which edges have been drawn
      var drawn = [];
      for (var i = 0; i < edges.length; ++i)
        drawn[i] = false;
      // First draw the edges from the beach line (Topmost arc has no edge)
      for (var curr = beach.getMinimum(); curr.next; curr = curr.next) {
        var ul = tangentCircle(curr.p, curr.next.p, currx);
        if (edges[curr.edge].vertices.length) {
          draw.drawEdge({p1: ul, p2: edges[curr.edge].vertices[0]});
        } else if (!drawn[curr.edge] && edges[curr.edge].uparc) {
          var ll = tangentCircle(edges[curr.edge].uparc.p, edges[curr.edge].uparc.next.p, currx);
          draw.drawEdge({p1: ul, p2: ll});
        }
        drawn[curr.edge] = true;
      }
      // Draw remaining edges
      for (var i = 0; i < edges.length; ++i) {
        if (drawn[i])
          continue;
        if (edges[i].vertices.length === 2 || edges[i].vertices.length === 3) {
          // Draw edge with both endpoints
          draw.drawEdge({p1: edges[i].vertices[0], p2: edges[i].vertices[1]});
        } else {
          // Error: Should have drawn this on the beach
          console.log("Error: Loose edge", edges[i]);
        }
      }
      return ret;
    }
  };
  return that;
};