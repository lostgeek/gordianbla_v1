<?php 
function createThumbnail($i) {
    $path = "./daily-puzzles/";
    $png_file = sprintf("thumb/%05d.png", $i);

    // Load SVG
    $svg_file = sprintf("%05d.svg.gz", $i);
    $data = file_get_contents($path.$svg_file);
    $uncompressed = gzdecode($data);

    // Parse mode
    $lines = explode(PHP_EOL, $uncompressed);
    $mode = explode(' ', $lines[3])[2];

    // Remove shapes above level 1
    if($mode == 'circles') {
        $level1elements = 20;
    } elseif($mode == 'beziers') {
        $level1elements = 100;
    } else {
        $level1elements = 10;
    }
    $svg = simplexml_load_string($uncompressed);
    $elements = $svg->children()[1]->children();
    // Traverse backwards through tree to avoid skipping elements
    for($i = count($elements); $i >= $level1elements; $i--) {
        unset($elements[$i]);
    }

    // Convert to png
    $im = new Imagick();
    $im->readImageBlob($svg->asXML());
    $im->setImageFormat("png24");
    $im->writeImage($path.$png_file);
    $im->clear();
    $im->destroy();
}
?>
