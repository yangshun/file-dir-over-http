const app = require('express')();
const fs = require('fs');
const nodePath = require('path');
const _ = require('lodash');

// ----- Allow CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

function listDirectory(path) {
  return fs.readdirSync(path);
}

app.get('*', function(req, res) {
  const path = req.originalUrl;

  // File.
  if (fs.lstatSync(path).isFile()) {
    res.setHeader('Content-Type', 'text/plain');
    const fileContents = fs.readFileSync(path);
    res.send(fileContents);
    return;
  }

  // Directory.
  res.setHeader('Content-Type', 'text/html');
  let contents = listDirectory(path);
  contents = contents.map(item => {
    const fullPath = path === '/' ? `${path}${item}` : `${path}/${item}`;
    const stats = fs.lstatSync(fullPath);
    return {
      isDirectory: stats.isDirectory(),
      path: fullPath,
      name: item,
      size: stats.size,
      dateModified: stats.mtimeMs,
      hidden: item[0] === '.',
    };
  });

  const styles = `
    <style>
      body {
        background: #f6f6f6;
      }
    </style>
  `;

  const higherLevelDirectory = nodePath.dirname(path);

  const compiled = _.template(`
    <script
      src="https://code.jquery.com/jquery-3.2.1.slim.min.js"
      integrity="sha256-k2WSCIexGzOj3Euiig+TlR8gA0EmPjuc79OEeY5L45g="
      crossorigin="anonymous"></script>
    <h1>Index of <%- path %></h1>
    <hr/>
    <a href="<%- higherLevelDirectory %>">Up to higher level directory</a>
    <label><input type="checkbox" id="hidden-file-toggle" checked> Show hidden objects</label>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Date Modified</th>
        </tr>
      </thead>
      <tbody>
        <% _.forEach(contents, function(item) { %>
          <% if (item.hidden) { %>
            <tr class="hidden-file">
          <% } else { %>
            <tr>
          <% } %>
            <td>
              <a href="<%- item.path %>"><%- item.name %></a>
            </td>
            <td>
              <%- item.size %>
            </td>
            <td>
              <%- item.dateModified %>
            </td>
          </tr>
        <% }); %>
      </tbody>
    </table>`
  );

  const script = `
    <script>
      $(() => {
        const rowsOfHiddenFiles = $('.hidden-file');
        $('#hidden-file-toggle').change(function() {
          const checked = $(this).prop('checked');
          rowsOfHiddenFiles.toggle(checked);
        });
      });
    </script>
  `

  const output = [styles, compiled({ contents, path, higherLevelDirectory }), script];
  res.send(output.join(''));
});

app.listen(5000);
