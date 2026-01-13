import cv2
import numpy as np
import os

class ProcessingService:
    def preprocess_image(self, input_path: str) -> str:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Image not found: {input_path}")
            
        # 1. Caricamento
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")
            
        # 2. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # --- NOVITÀ: RESTAURO LINEE ---
        
        # 3. Gaussian Blur: Sfoca leggermente per unire i pixel "vicini ma staccati"
        # Ideale per i baffi e i contorni della scritta
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # 4. Otsu Thresholding (Invertito)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # 5. Chiusura Morfologica: Tappa i micro-buchi all'interno delle linee nere
        kernel_unione = np.ones((3, 3), np.uint8)

        # 5. Chiusura Morfologica più forte ( iterations=2 per "saldare" i baffi)
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_unione, iterations=2)

        # 6. Dilatazione più decisa
        dilated = cv2.dilate(closed, kernel_unione, iterations=1)

        # 7. Skeletonization (Thinning)
        skeleton = self._skeletonize(dilated)
        
        # 8. Inversione finale per il salvataggio/vettorializzatore
        final_img = cv2.bitwise_not(skeleton)
        
        # Determinazione path di output
        dir_name = os.path.dirname(input_path)
        base_name = os.path.basename(input_path)
        name, ext = os.path.splitext(base_name)
        output_filename = f"{name}_processed{ext}"
        output_path = os.path.join(dir_name, output_filename)
        
        cv2.imwrite(output_path, final_img)
        return output_path

    def _skeletonize(self, img):
        """ Algoritmo di scheletrizzazione morfologica """
        size = np.size(img)
        skel = np.zeros(img.shape, np.uint8)
        
        # Elemento strutturante a croce
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        
        done = False
        temp_img = img.copy()
        
        while not done:
            # Erosione
            eroded = cv2.erode(temp_img, element)
            # Apertura (Erosione poi Dilatazione)
            temp = cv2.dilate(eroded, element)
            # Sottrazione per trovare i bordi
            temp = cv2.subtract(temp_img, temp)
            # Unione nello scheletro
            skel = cv2.bitwise_or(skel, temp)
            temp_img = eroded.copy()
            
            zeros = size - cv2.countNonZero(temp_img)
            if zeros == size:
                done = True
                
        return skel

processing_service = ProcessingService()