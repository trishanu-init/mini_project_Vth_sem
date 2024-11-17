import React, { useState ,useEffect} from 'react';
import {db} from './firebase';
import { onValue, ref } from "firebase/database";
import ReactMarkdown from 'react-markdown';
import {jsPDF} from 'jspdf';
import {QRCodeSVG} from 'qrcode.react';
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

const DiseaseAnalysis = () => {
  return (
    <div>
      <Predict />
    </div>
  );
};

const Predict = () => {

  const [sensorData, setSensorData] = useState({
    Temperature: '-- °C',
    Humidity: '-- %',
    Moisture: '-- %',
    Rain: '-- mm',
  });

  const [showQR, setShowQR] = useState(false);
  const handleGenerateQR = () => setShowQR(true);
  const handleCloseQR = () => setShowQR(false);

  const handleDownloadReport = () => {
    const doc = new jsPDF();

    // Add content to the PDF
    const currentDate = new Date().toLocaleString();
    doc.setFontSize(16);
    doc.text("Disease Diagnosis Report", 10, 10);
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 10, 20);
    doc.text(`Detected Disease: ${diseaseResult || "Not Available"}`, 10, 30);
    doc.text("Analysis:", 10, 40);
    doc.setFontSize(10);

    const response = gptResponse || "No response available.";
    const splitText = doc.splitTextToSize(response, 180);
    doc.text(splitText, 10, 50);

    // Save the PDF
    doc.save(`Disease_Report_${currentDate}.pdf`);
  };

  // Fetch sensor data on component mount
  useEffect(() => {
    const sensorRef = ref(db, 'sensor');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val() || {};

      const updateData={
        ...data,
        Rain: data.Rain===1? "Not Raining" : "Raining",
      }
      setSensorData(updateData);
    });

    return () => unsubscribe(); // Cleanup function to detach listener
  }, []);

  // const [activeTab, setActiveTab] = useState(0);
  
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [gptResponse, setGptResponse] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (e) => setSelectedLanguage(e.target.value);
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(URL.createObjectURL(event.target.files[0]));
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("No file selected");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('https://leaf-disease-detection-backend.onrender.com/process_input', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setDiseaseResult(result.result);

      const prompt = `Given the detected plant disease,Tomato_Early_Blight, and current environmental conditions—temperature at ${sensorData.Temperature} °C, humidity at ${sensorData.Humidity}% —suggest an effective treatment plan. Include specific treatment options, such as organic or chemical solutions, along with application frequency and precautions. Recommend adjustments to the environment, if feasible, to help control the disease and aid recovery. Finally, offer preventive care tips to avoid recurrence under similar conditions in ${selectedLanguage}.`;
      const output = await model.generateContent(prompt);
      const respo = await output.response;
      const content = await respo.text();
      setGptResponse(content);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const [showFullContent, setShowFullContent] = useState(false);
  const visibleContent = gptResponse
    ? gptResponse.slice(0, Math.ceil(gptResponse.length * 0.07)) + "..........."
    : "";

  const handleReadMoreClick = () => setShowFullContent(true);
  const handleCloseDialog = () => setShowFullContent(false);

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#679267] p-4">
      <div className="flex flex-row w-full max-w-5xl">
        
        {/* Sensor Data Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/4 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-center text-green-800">Sensor Data</h2>
          <div className="bg-green-100 p-3 rounded-md w-full mb-2 text-center shadow-md">
            <h4 className="font-semibold text-green-700">Temperature</h4>
            <p className="text-gray-700">{sensorData.Temperature}°C</p>
          </div>
          <div className="bg-green-100 p-3 rounded-md w-full mb-2 text-center shadow-md">
            <h4 className="font-semibold text-green-700">Humidity</h4>
            <p className="text-gray-700">{sensorData.Humidity}%</p>
          </div>
          <div className="bg-green-100 p-3 rounded-md w-full mb-2 text-center shadow-md">
            <h4 className="font-semibold text-green-700">Moisture</h4>
            <p className="text-gray-700">{sensorData.Moisture}%</p>
          </div>
          <div className="bg-green-100 p-3 rounded-md w-full mb-2 text-center shadow-md">
            <h4 className="font-semibold text-green-700">Rain</h4>
            <p className="text-gray-700">{sensorData.Rain}</p>
          </div>
        </div>

        {/* Main Outer Box */}
        <div id="outer-box" className="bg-white p-6 rounded-lg shadow-lg w-3/4 flex flex-col md:flex-row ml-4">
          <div className="flex flex-col items-center w-full md:w-1/2 md:pr-4 mb-4 md:mb-0">
            <h2 className="text-3xl font-bold mb-4 text-center text-green-800">Upload an Image</h2>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">Select Language</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm mb-4"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi-हिन्दी</option>
              <option value="kannada">Kannada-ಕನ್ನಡ</option>
              <option value="bengali">Bengali-বাংলা</option>
              <option value="gujarati">Gujarati-ગુજરાતી</option>
              <option value="malayalam">Malayalam-മലയാളം</option>
              <option value="marathi">Marathi-मराठी</option>
              <option value="nepali">Nepali-नेपाली</option>
              <option value="punjabi">Punjabi-ਪੰਜਾਬੀ</option>
              <option value="tamil">Tamil-தமிழ்</option>
              <option value="telugu">Telugu-తెలుగు</option>
              <option value="odia">Odia</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
            />
            <div className="mt-4 w-full h-64 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
              {selectedImage ? (
                <img src={selectedImage} alt="Selected" className="rounded-lg max-w-full max-h-full shadow-md" />
              ) : (
                <span className="text-green-700">No Image Selected</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              className="mt-4 w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        <div className="flex flex-col items-center w-full md:w-1/2 md:pl-4">
          {!diseaseResult && !loading && (
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-3xl font-bold text-green-800">Disease Diagnosis</h3>
              <img
                src="/happyplant.png"
                className="w-full h-full opacity-40 mt-20"
              />
            </div>
          )}
          {loading && (
            <div className="mt-10 p-4 bg-green-100 rounded-lg shadow-md w-full h-full text-center">
              <p className="text-green-700">Analyzing your Image. Please wait...</p>
              <div className="flex items-center justify-center">
                <iframe
                  src="https://lottie.host/embed/9fb64850-84eb-4cb3-8ab1-b623f2520aec/RIQU4wm0Rc.json"
                  width="300"
                  height="300">
                  <img src="/happyplant.png" className="w-full h-full opacity-40 mt-20" />
                </iframe>
              </div>
            </div>
          )}
          {diseaseResult && !loading && (
            <div className="mt-20 p-4 bg-green-100 rounded-lg shadow-md w-full text-center">
              <h3 className="text-xl font-semibold text-green-800">Detected Disease:</h3>
              <p className="text-green-700 mb-4">{diseaseResult}</p>
              {gptResponse && (
                <div id="Response" className="mt-4 p-4 bg-green-100 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-green-800">Information:</h4>
                <p className="text-green-700 mb-4 text-left">
                  <ReactMarkdown>
                  {gptResponse ? (showFullContent ? gptResponse : visibleContent) : "No information available."}
                  </ReactMarkdown>
                </p>
                {!showFullContent && gptResponse && (
                  <button
                    onClick={handleReadMoreClick}
                    className="mt-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                  >
                    Read More
                  </button>
                )}
            
                {/* Dialog Box */}
{showFullContent && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white w-[90%] sm:w-[600px] h-[80%] p-6 rounded-lg shadow-lg flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-green-800">Detailed Information:</h4>
        <button
          onClick={handleCloseDialog}
          className="text-green-600 hover:text-green-800 font-bold text-lg"
        >
          ✖
        </button>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-grow overflow-y-auto mb-4 pr-2 text-left">
        <p className="text-gray-700"><ReactMarkdown>{gptResponse}</ReactMarkdown></p>
      </div>

      {/* Footer Section */}
      
      <div className="flex justify-between">
              <button
                onClick={handleDownloadReport}
                className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                Download Report
              </button>
              <button
                onClick={handleGenerateQR}
                className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                Generate QR
              </button>
            </div>
    </div>
  </div>
)}
{/* QR Code Popup */}
{showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <h4 className="text-lg font-semibold text-green-800 mb-4">
              QR Code for Report
            </h4>
            <QRCodeSVG value="Generated_Report.pdf" size={256} />
            <button
              onClick={handleCloseQR}
              className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DiseaseAnalysis;
