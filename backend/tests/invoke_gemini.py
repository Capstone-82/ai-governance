from google import genai
import dotenv
import os
dotenv.load_dotenv()

# TODO(developer): Update below line
API_KEY = os.getenv("GOOGLE_API_KEY")

client = genai.Client(vertexai=True, api_key=API_KEY)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain bubble sort to me.",
)

print(response.text)
# Example response:
# Bubble Sort is a simple sorting algorithm that repeatedly steps through the list