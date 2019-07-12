<!doctype html>
<html>
  <head>
    <title>Voronoi customizer</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <div id="map"></div>
    <input type="button" id="compute" value="Compute" style="display:none;">
    <input type="button" id="preset1" value="Hexagon">
    <input type="button" id="preset2" value="Tutte le strade portano a Roma">
    <input type="button" id="preset3" value="Phi">
    <input type="button" id="preset4" value="Straight">
    <input type="button" id="preset5" value="Double phi">
    <input type="button" id="preset6" value="Triple phi">
    <input type="button" id="preset7" value="Max phi">
    <input type="checkbox" id="perturbation" checked> Point perturbation

    <script src="https://code.jquery.com/jquery-3.4.0.min.js"></script>
    <script src="https://cdn.rawgit.com/google/closure-library/master/closure/goog/base.js"></script>
    <script src="geometry.js"></script>
    <script src="voronoi.js"></script>
    <script>
      //let points = [];
      $(document).ready(() => {
        $("#map-height").val($("#map").height());
        $("#map-width").val($("#map").width());

        let sys = new VoronoiSystem($("#map"));
        sys.addHandlers();

        $("#compute").click(_ => {
          sys.complete();
        });

        $("#preset1").click(_ => {
          sys.reset();
          let dr = 50;
          let dtheta = 60;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            for (let theta = 0; theta < 360; theta += dtheta) {
              points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
            }
          }
          sys.addPoints(points);
        });

        $("#preset2").click(_ => {
          sys.reset();
          let dr = 20;
          let dtheta = 20;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            for (let theta = 0; theta < 360; theta += dtheta) {
              points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
            }
          }
          sys.addPoints(points);
        });

        $("#preset3").click(_ => {
          sys.reset();
          let dr = 5;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          let theta = 0;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            theta = r;
            points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
          }
          sys.addPoints(points);
        });

        $("#preset4").click(_ => {
          sys.reset();
          let levelmax = 5;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          for (let level = 0; level < levelmax; level++) {
            for (let i = 0; i < Math.pow(2, level); i++) {
              for (let j = 0; j < Math.pow(2, level); j++) {
                points.push({x: centerX * (i * 2 + 1), y: centerY * (j * 2 + 1)});
              }
            }
            centerX /= 2;
            centerY /= 2;
          }
          sys.addPoints(points);
        });

        $("#preset5").click(_ => {
          sys.reset();
          let dr = 5;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          let dtheta = 180;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            for (let theta = r, dthetatot = dtheta; dthetatot <= 360; theta += dtheta, dthetatot += dtheta) {
              points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
            }
          }
          sys.addPoints(points);
        });

        $("#preset6").click(_ => {
          sys.reset();
          let dr = 5;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          let dtheta = 120;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            for (let theta = r, dthetatot = dtheta; dthetatot <= 360; theta += dtheta, dthetatot += dtheta) {
              points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
            }
          }
          sys.addPoints(points);
        });

        $("#preset7").click(_ => {
          sys.reset();
          let dr = 5;
          let points = [];
          let centerX = $("#map").width() / 2;
          let centerY = $("#map").height() / 2;
          let dtheta = 360/4;
          for (let r = dr; r < $("#map").width() / 2; r += dr) {
            for (let theta = r, dthetatot = dtheta; dthetatot <= 360; theta += dtheta, dthetatot += dtheta) {
              points.push({x: centerX + r * Math.cos(theta * Math.PI / 180), y: centerY + r * Math.sin(theta * Math.PI / 180)});
            }
          }
          sys.addPoints(points);
        });

        $("#perturbation").click(_ => {
          sys.setPerturbation($("#perturbation").prop("checked"));
        });
      });
    </script>
  </body>
</html>