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
        
        # 3. Otsu Thresholding
        # Usiamo THRESH_BINARY_INV perché gli algoritmi morfologici 
        # lavorano meglio con l'oggetto BIANCO su sfondo NERO
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # 4. Skeletonization (Thinning)
        # Riduce le linee a 1 pixel di spessore
        skeleton = self._skeletonize(thresh)
        
        # 5. Inversione finale per il salvataggio/vettorializzatore
        # Riportiamo a: Sfondo Bianco, Linee Nere
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