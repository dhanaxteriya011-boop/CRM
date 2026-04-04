<?php
namespace App\Http\Controllers;
use App\Models\File;
use Illuminate\Http\Request;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
            'fileable_id' => 'required|integer',
            'fileable_type' => 'required|string',
        ]);
        $path = $request->file('file')->store('crm-files', 'public');
        $file = File::create([
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $request->file('file')->getMimeType(),
            'uploaded_by' => auth()->id(),
            'fileable_id' => $request->fileable_id,
            'fileable_type' => $request->fileable_type,
        ]);
        return response()->json($file, 201);
    }

    public function destroy(File $file)
    {
        \Storage::disk('public')->delete($file->path);
        $file->delete();
        return response()->json(['message' => 'Deleted']);
    }
}