from flask import Flask, send_file, make_response, request, render_template, abort

app = Flask(__name__, static_folder='../static', template_folder='../templates')

@app.route("/")
def index():
    return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True)