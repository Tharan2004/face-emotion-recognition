"""
Model Conversion Script: .keras → .onnx

IMPORTANT: Run this script on a machine that has TensorFlow installed.
           (TensorFlow does NOT support Python 3.14 yet)
           Use Python 3.10-3.12 for this script.

Usage:
    pip install tensorflow tf2onnx
    python convert_model.py path/to/your_model.keras

This will create an .onnx file in the backend/model/ folder.
"""
import sys
import os


def convert_keras_to_onnx(keras_model_path, output_path=None):
    """
    Convert a .keras or .h5 model to ONNX format.
    
    Args:
        keras_model_path: Path to the .keras or .h5 model file
        output_path: Optional output path for .onnx file
    """
    try:
        import tensorflow as tf
        import tf2onnx
    except ImportError:
        print("=" * 60)
        print("ERROR: This script requires TensorFlow and tf2onnx")
        print()
        print("Install them with:")
        print("  pip install tensorflow tf2onnx")
        print()
        print("NOTE: TensorFlow requires Python 3.10-3.12")
        print("      If you're on Python 3.14, use a different")
        print("      Python installation for this conversion.")
        print("=" * 60)
        sys.exit(1)

    if not os.path.exists(keras_model_path):
        print(f"ERROR: Model file not found: {keras_model_path}")
        sys.exit(1)

    # Determine output path
    if output_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(script_dir, "model", "emotion_model.onnx")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"Loading model from: {keras_model_path}")
    model = tf.keras.models.load_model(keras_model_path)

    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")

    # Convert to ONNX
    print("Converting to ONNX format...")
    input_signature = [
        tf.TensorSpec(model.input_shape, tf.float32, name="input")
    ]

    onnx_model, _ = tf2onnx.convert.from_keras(
        model, input_signature=input_signature, opset=13
    )

    # Save
    import onnx
    onnx.save(onnx_model, output_path)

    print(f"\n✅ Model successfully converted!")
    print(f"   Saved to: {output_path}")
    print(f"   File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
    print()
    print("Next steps:")
    print(f"  1. Copy {output_path} to your project's backend/model/ folder")
    print("  2. Make sure the filename matches MODEL_PATH in config.py")
    print("  3. Start the server with: python run.py")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_model.py <path_to_model.keras> [output_path.onnx]")
        print()
        print("Example:")
        print("  python convert_model.py my_emotion_model.keras")
        print("  python convert_model.py my_model.keras model/emotion_model.onnx")
        sys.exit(1)

    keras_path = sys.argv[1]
    onnx_path = sys.argv[2] if len(sys.argv) > 2 else None
    convert_keras_to_onnx(keras_path, onnx_path)
