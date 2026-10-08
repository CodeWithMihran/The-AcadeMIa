package com.app

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AcademiaDocumentPickerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {
  private var pickerPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = "AcademiaDocumentPicker"

  @ReactMethod
  fun open(promise: Promise) {
    if (pickerPromise != null) {
      promise.reject("PICKER_BUSY", "A file picker is already open.")
      return
    }

    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "The file picker is unavailable right now.")
      return
    }

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "*/*"
      putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf", "image/jpeg", "image/png"))
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    pickerPromise = promise
    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Exception) {
      pickerPromise = null
      promise.reject("PICKER_UNAVAILABLE", "Could not open the Android file picker.", error)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) return
    val promise = pickerPromise ?: return
    pickerPromise = null

    if (resultCode != Activity.RESULT_OK) {
      promise.resolve(null)
      return
    }

    val uri = data?.data
    if (uri == null) {
      promise.reject("NO_FILE_SELECTED", "No file was selected.")
      return
    }

    try {
      promise.resolve(uri.toPickerMap())
    } catch (error: Exception) {
      promise.reject("FILE_METADATA_ERROR", "Could not read the selected file.", error)
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  private fun Uri.toPickerMap() = Arguments.createMap().apply {
    val mimeType = reactContext.contentResolver.getType(this@toPickerMap).orEmpty()
    val metadata = queryMetadata(this@toPickerMap)
    putString("uri", toString())
    putString("name", metadata.first)
    putString("type", mimeType)
    putDouble("size", metadata.second.toDouble())
  }

  private fun queryMetadata(uri: Uri): Pair<String, Long> {
    var cursor: Cursor? = null
    try {
      cursor = reactContext.contentResolver.query(uri, null, null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        val name = if (nameIndex >= 0) cursor.getString(nameIndex) else null
        val size = if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) cursor.getLong(sizeIndex) else -1L
        return (name ?: "study-notes") to size
      }
    } finally {
      cursor?.close()
    }
    return "study-notes" to -1L
  }

  companion object {
    private const val REQUEST_CODE = 7842
  }
}
