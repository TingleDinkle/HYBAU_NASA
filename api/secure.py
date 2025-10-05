#anti readable and access other folder on simple python server
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

PORT = 8080
BASE_DIR = "/home/ec2-user/public/Frontend"
INDEX_FILE = os.path.join(BASE_DIR, "templates/index.html")

class secure_http(SimpleHTTPRequestHandler):  # access only index and static files
    ALLOWED_PATHS = [
        "/index.html",
        "/static/css/style.css",
        "/static/js/script.js"
    ]

    def list_directory(self, path):
        # block folder viewing
        self.send_error(403, "Access denied")
        return None

    def do_GET(self):
        # change / to index.html
        if self.path == "/" or self.path == "/index.html":
            self.path = INDEX_FILE
            self.send_index()
            return

        # Allow file loading in /static
        if self.path in self.ALLOWED_PATHS:
            full_path = os.path.join(BASE_DIR, self.path.lstrip("/"))
            if os.path.isfile(full_path):
                self.path = full_path
                self.send_index()
            else:
                self.send_error(404, "File not found")
            return

        # Block all other requests
        self.send_error(403, "Access denied")

    def send_index(self):  # send file
        try:
            with open(self.path, 'rb') as file:
                self.send_response(200)
                # Automatically detect files based on format
                if self.path.endswith(".css"):
                    ctype = "text/css"
                elif self.path.endswith(".js"):
                    ctype = "application/javascript"
                else:
                    ctype = "text/html"
                self.send_header("Content-type", ctype)
                self.end_headers()
                self.wfile.write(file.read())
        except Exception:
            self.send_error(404, "File not found")

if __name__ == "__main__":  # run server
    os.chdir(BASE_DIR)  # Ensure correct base directory
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, secure_http)
    print(f"✅ Serving secure site on port {PORT}")
    httpd.serve_forever()

#rewrite this code to be more readable and pythonic

#anti readable and access other folder on simple python server
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

PORT = 8080
BASE_DIR = "/home/ec2-user/public/Frontend"
INDEX_FILE = os.path.join(BASE_DIR, "templates/index.html")
ALLOWED_PATHS = {
    "/index.html",
    "/static/css/style.css",
    "/static/js/script.js"
}
class secure_http(SimpleHTTPRequestHandler):  # access only index and static files
    def list_directory(self, path):
        #prevent directory listing
        self.send_error(403, "Access denied")
        return None
    def do_GET(self):
        # Redirect "/" to index.html
        if self.path in {"/", "/index.html"}:
            self.serve_file(INDEX_FILE)
            return

        # Allow loading static files
        if self.path in ALLOWED_PATHS:
            full_path = os.path.join(BASE_DIR, self.path.lstrip("/"))
            if os.path.isfile(full_path):
                self.serve_file(full_path)
            else:
                self.send_error(404, "File not found")
            return

        # Block all other requests
        self.send_error(403, "Access denied")
    def serve_file(self, file_path):  # send file
        try:
            with open(file_path, 'rb') as file:
                self.send_response(200)
                # Automatically determine content-type based on file extension
                if file_path.endswith(".css"):
                    ctype = "text/css"
                elif file_path.endswith(".js"):
                    ctype = "application/javascript"
                else:
                    ctype = "text/html"
                self.send_header("Content-type", ctype)
                self.end_headers()
                self.wfile.write(file.read())
        except Exception:
            self.send_error(404, "File not found")
if __name__ == "__main__":  # run server
    os.chdir(BASE_DIR)  # ensure correct working dir
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, secure_http)
    print("Serving secure site on port {PORT}")
    httpd.serve_forever()
