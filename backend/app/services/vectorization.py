import cv2
import numpy as np
import os

class VectorizationService:
    def vectorize_image(self, input_path: str) -> str:
        """
        Converts the image to SVG paths using OpenCV contours.
        Input is expected to be a binarized image (White BG, Black Lines).
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Image not found: {input_path}")
            
        # Read image
        img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")
            
        # For findContours, objects should be White, BG Black.
        # Our input is likely White BG, Black Lines. So we invert it.
        inverted = cv2.bitwise_not(img)
        
        # Find contours
        # RETR_LIST gives all contours. RETR_EXTERNAL only outer. RETR_TREE hierarchy.
        # For a sketch, we probably want minimal hierarchy, just lines.
        # CHAIN_APPROX_SIMPLE compresses horizontal, vertical, and diagonal segments.
        contours, _ = cv2.findContours(inverted, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        height, width = img.shape
        
        # Build SVG content
        svg_lines = []
        svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">')
        
        # Add a white background rect? Optional. Plotters don't need it.
        
        for contour in contours:
            if len(contour) < 2:
                continue
                
            # Start path
            # contour is a list of points [[[x, y]], [[x, y]], ...]
            start_point = contour[0][0]
            path_d = f"M {start_point[0]} {start_point[1]}"
            
            for i in range(1, len(contour)):
                point = contour[i][0]
                path_d += f" L {point[0]} {point[1]}"
            
            # Close path if it's a closed loop? Usually contours are closed by definition in findContours
            # But for drawing, we might just want the lines.
            # Let's close it to be safe for filling, but for plotting "stroke" is what matters.
            path_d += " Z"
            
            # Add path element
            # fill="none" stroke="black" stroke-width="1"
            svg_lines.append(f'<path d="{path_d}" fill="none" stroke="black" stroke-width="1"/>')
            
        svg_lines.append('</svg>')
        
        # Save SVG
        dir_name = os.path.dirname(input_path)
        base_name = os.path.basename(input_path)
        name, _ = os.path.splitext(base_name)
        # Remove _processed if it exists to keep name clean? Or keep it.
        # Let's call it .svg
        output_filename = f"{name}.svg"
        output_path = os.path.join(dir_name, output_filename)
        
        with open(output_path, "w") as f:
            f.write("\n".join(svg_lines))
            
        return output_path

vectorization_service = VectorizationService()
