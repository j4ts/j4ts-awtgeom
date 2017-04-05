package javaemul.internal;

public final class ExceptionHelper {
  
  private ExceptionHelper() {
  }
  
  public static NumberFormatException forInputString(String s) {
    return new NumberFormatException("For input string: \"" + s + "\"");
  }

  public static NumberFormatException forNullInputString() {
    return new NumberFormatException("null");
  }

  public static NumberFormatException forRadix(int radix) {
    return new NumberFormatException("radix " + radix + " out of range");
  }

}
