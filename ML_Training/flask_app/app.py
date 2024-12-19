from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import pickle
from werkzeug.utils import secure_filename
from PIL import Image
# import tensorflow as tf


app = Flask(__name__)

CORS(app)

# Load classification model and label transform model
with open('plant_disease_classification_model001.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

with open('plant_disease_label_transform.pkl', 'rb') as label_file:
    label_binarizer = pickle.load(label_file)


UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to convert image to array
def convert_image_to_array(image_path):
    img = Image.open(image_path)
    img = img.resize((256, 256))  # Resize to the model's expected input shape
    return np.array(img)

# Prediction function
def predict_disease(image_path):
    image_array = convert_image_to_array(image_path)
    np_image = np.array(image_array, dtype=np.float16) / 225.0
    np_image = np.expand_dims(np_image, 0)  # Add batch dimension
    result = model.predict(np_image)
    pred_class = np.argmax(result[0])  # Get the index of the max probability
    predicted_class_label = label_binarizer.classes_[pred_class]  # Map index to label
    return predicted_class_label

# API Endpoint for predicting disease
@app.route('/predict', methods=['POST'])
def upload_image():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']

    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "No selected file or invalid file type"}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    

    try:
        predicted_label = predict_disease(file_path)
        return jsonify({"prediction": predicted_label}), 200
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
