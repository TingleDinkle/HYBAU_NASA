# anti-readable and access other folders on a simple Python server
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

PORT = 8000
INDEX_FILE = "/home/ec2-user/public/Frontend/templates/index.html"


class secure_http(SimpleHTTPRequestHandler): #access only index file
    def do_GET(self):
        if self.path == '/':
            self.path = INDEX_FILE
            return self.send.index()
            return super().do_GET()
        else:
            self.send_error(403, "Access denied") #deny access to other files on the server
    
    def send_index(self): #send index file
        try:
            with open(self.path, 'rb') as file:
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(file.read())
        except Exception as e:
            self.send_error(404, "File not found")

if __name__ == "__main__": #run server
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, secure_http)
    httpd.serve_forever()

    
